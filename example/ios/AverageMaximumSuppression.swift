//
//  AverageMaximumSuppression.swift
//  VisionCameraExample
//
//  Created by Marc Rousavy on 24.11.22.
//

import Foundation

extension Array {
    func repeated(count: Int) -> Array<Element> {
        assert(count > 0, "count must be greater than 0")

        var result = self
        for _ in 0 ..< count - 1 {
            result += self
        }

        return result
    }
}

func argsort<T:Comparable>( a : [T] ) -> [Int] {
    var r = Array(a.indices)
    r.sort(by: { a[$0] > a[$1] })
    return r
}

struct BoxPrediction {
    var rect: CGRect
    var score: Float
    
    init(rect: CGRect, score: Float) {
        self.rect = rect
        self.score = score
    }
}

struct AverageMaximumSuppresion {
    private var referenceAnchorX: [Float]
    private var referenceAnchorY: [Float]
    private let scale: Float = 128.0
    let screenSize: CGRect = UIScreen.main.bounds
    
    static let emptyBox = BoxPrediction(rect: CGRect.zero, score: 0)
    
    init() {
        let smallBoxes: [Float] = Array(stride(from: 0.03125, to: 1.03125, by: 0.0625))
        let smallX = smallBoxes.map({ [Float](repeating: $0, count: 2) }).flatMap({ $0 }).repeated(count: 16)
        let smallY = smallBoxes.map({ [Float](repeating: $0, count: 32) }).flatMap({ $0 })

        let bigBoxes: [Float] = Array(stride(from: 0.0625, to: 1.0625, by: 0.125))
        let bigX = bigBoxes.map({ [Float](repeating: $0, count: 6) }).flatMap({ $0 }).repeated(count: 8)
        let bigY = bigBoxes.map({ [Float](repeating: $0, count: 48) }).flatMap({ $0 })

        referenceAnchorX = smallX + bigX
        referenceAnchorY = smallY + bigY
    }
    
    func getFinalBoxes(rawXArray: [Float], rawYArray: [Float], rawWidthArray: [Float], rawHeightArray: [Float], classPredictions: [Float], imageWidth: Float, imageHeight: Float, cameraSize: CGRect) -> [BoxPrediction] {
        let xArray = rawXArray.map() { $0 / scale}
        let yArray = rawYArray.map() { $0 / scale}

        let xCenter = zip(xArray, referenceAnchorX).map() {$0 + $1}
        let yCenter = zip(yArray, referenceAnchorY).map() {$0 + $1}

        let widthArray = rawWidthArray.map() { $0 / scale}
        let heightArray = rawHeightArray.map() { $0 / scale}

        let xMinArray = zip(xCenter, widthArray).map() {$0 - ($1 / 2.0)}
        let yMinArray = zip(yCenter, heightArray).map() {$0 - ($1 / 2.0)}

        let xMaxArray = zip(xCenter, widthArray).map() {$0 + ($1 / 2.0)}
        let yMaxArray = zip(yCenter, heightArray).map() {$0 + ($1 / 2.0)}

        let scoresFiltered = classPredictions.filter() { $0 > 0.75 }
        
        var faces: [BoxPrediction] = []

        if scoresFiltered.count == 0 {
            return [AverageMaximumSuppresion.emptyBox]
        }

        let xFiltered = zip(classPredictions, xMinArray).filter() {$0.0 > 0.75 }.map({ $1 })
        let yFiltered = zip(classPredictions, yMinArray).filter() {$0.0 > 0.75 }.map({ $1 })
        let xMaxFiltered = zip(classPredictions, xMaxArray).filter() {$0.0 > 0.75 }.map({ $1 })
        let yMaxFiltered = zip(classPredictions, yMaxArray).filter() {$0.0 > 0.75 }.map({ $1 })
        
        var remaining = argsort(a: scoresFiltered)

        while remaining.count > 0 {
            let detectionX = xFiltered[remaining[0]]
            let detectionY = yFiltered[remaining[0]]
            let detectionXMax = xMaxFiltered[remaining[0]]
            let detectionYMax = yMaxFiltered[remaining[0]]
            let currentScore = scoresFiltered[remaining[0]]

            let mainBox = [detectionX * 128.0, detectionY * 128.0, detectionXMax * 128.0, detectionYMax * 128.0]

            let otherX = remaining.map { xFiltered[$0] }
            let otherY = remaining.map { yFiltered[$0] }
            let otherXMax = remaining.map { xMaxFiltered[$0] }
            let otherYMax = remaining.map { yMaxFiltered[$0] }

            let iouResults = computeIou(xArray: otherX, yArray: otherY, xMaxArray: otherXMax, yMaxArray: otherYMax, mainCoords: mainBox)

            let overlapping = zip(iouResults, remaining).filter() {$0.0 > 0.3 }.map({ $1 })
            
            remaining = zip(iouResults, remaining).filter() {$0.0 <= 0.3 }.map({ $1 })

            if overlapping.count > 0 {
                var otherX = overlapping.map { xFiltered[$0] }
                var otherY = overlapping.map { yFiltered[$0] }
                var otherXMax = overlapping.map { xMaxFiltered[$0] }
                var otherYMax = overlapping.map { yMaxFiltered[$0] }
                let scores = overlapping.map { scoresFiltered[$0] }
                
                var totalScore = scores.reduce(0, { x, y in
                    x + y
                })
                
                otherX = zip(scores, otherX).map() { $0 * $1 }
                otherY = zip(scores, otherY).map() { $0 * $1 }
                otherXMax = zip(scores, otherXMax).map() { $0 * $1 }
                otherYMax = zip(scores, otherYMax).map() { $0 * $1 }
                
                let finalX = otherX.reduce(0, { x, y in
                    x + y
                }) / totalScore
                
                let finalY = otherY.reduce(0, { x, y in
                    x + y
                }) / totalScore
                
                let finalXMax = otherXMax.reduce(0, { x, y in
                    x + y
                }) / totalScore
                
                let finalYMax = otherYMax.reduce(0, { x, y in
                    x + y
                }) / totalScore
                
                totalScore = totalScore / Float(overlapping.count)
                
                let scaleY = imageWidth / imageHeight
                let offsetY: Float = 0.20 //(1 - scaleY) / 2
                
                var finalHeight = (finalYMax * scaleY) - (finalY * scaleY)
                finalHeight = finalHeight * Float(cameraSize.height)//1440.0
                

                var y1 = (finalY * scaleY) + offsetY
                y1 = (y1 * Float(cameraSize.height)) - Float(abs(cameraSize.origin.y)) // * 1440, - 180.0
                
                var finalWidth = abs(finalXMax - 1) - abs(finalX - 1)
                finalWidth = finalWidth * Float(cameraSize.width)// 810.0
                
                var xCoord = abs(finalX - 1) * Float(cameraSize.width) //810.0
                xCoord = xCoord - Float(abs(cameraSize.origin.x))
                
                var boxesRect: CGRect = CGRect.zero
                
                boxesRect.origin.y = CGFloat(y1)
                boxesRect.origin.x = CGFloat(xCoord)
                boxesRect.size.height = CGFloat(finalHeight)
                boxesRect.size.width = CGFloat(finalWidth)
                
                let weightedDetection = BoxPrediction(rect: boxesRect, score: totalScore)
                
                faces.append(weightedDetection)
            } else {

                let scaleY = imageWidth / imageHeight
                let offsetY: Float = 0.20 //(1 - scaleY) / 2
                
                var y1 = (detectionY * scaleY) + offsetY
                y1 = (y1 * Float(cameraSize.height)) - Float(abs(cameraSize.origin.y)) // * 1440, - 180.0
                
                var finalHeight = (detectionYMax * scaleY) - (detectionY * scaleY)
                finalHeight = finalHeight * Float(cameraSize.height) //1440.0
                
                var finalWidth = abs(detectionXMax - 1) - abs(detectionX - 1)
                finalWidth = finalWidth * Float(cameraSize.width)// 810.0
                
                var xCoord = abs(detectionX - 1) * Float(cameraSize.width) //810.0
                xCoord = xCoord - Float(abs(cameraSize.origin.x))
                
                var boxesRect: CGRect = CGRect.zero
                
                boxesRect.origin.y = CGFloat(y1)
                boxesRect.origin.x = CGFloat(xCoord)
                boxesRect.size.height = CGFloat(finalHeight)
                boxesRect.size.width = CGFloat(finalWidth)
                
                let detection = BoxPrediction(rect: boxesRect, score: currentScore)
                
                faces.append(detection)
            }
        }
        return faces
    }
    
    private func computeIou(xArray: [Float], yArray: [Float], xMaxArray: [Float], yMaxArray: [Float], mainCoords: [Float]) -> [Float] {
        let xMin = xArray.map { coord -> Float in
            if (coord * 128.0) > mainCoords[0] {
                return coord * 128.0
            } else {
                return mainCoords[0]
            }
        }

        let yMin = yArray.map { coord -> Float in
            if (coord * 128.0) > mainCoords[1] {
                return coord * 128.0
            } else {
                return mainCoords[1]
            }
        }

        let xMax = xMaxArray.map { coord -> Float in
            if (coord * 128.0) < mainCoords[2] {
                return coord * 128.0
            } else {
                return mainCoords[2]
            }
        }

        let yMax = yMaxArray.map { coord -> Float in
            if (coord * 128.0) < mainCoords[3] {
                return coord * 128.0
            } else {
                return mainCoords[3]
            }
        }

        var overlapArea: [Float] = []

        for i in 0...(xMin.count - 1) {
            let maxXValue = max(0.0, xMax[i] - xMin[i] + 1)
            let maxYValue = max(0.0, yMax[i] - yMin[i] + 1)
            overlapArea.append(maxXValue * maxYValue)
        }

        let trueBoxesArea = (mainCoords[2] - mainCoords[0] + 1) * (mainCoords[3] - mainCoords[1] + 1)

        var predictedBoxesArea: [Float] = []

        for i in 0...(xMin.count - 1) {
            let xArea = (xMaxArray[i] * 128.0) - (xArray[i] * 128.0) + 1
            let yArea = (yMaxArray[i] * 128.0) - (yArray[i] * 128.0) + 1

            predictedBoxesArea.append(xArea * yArea)
        }

        var unionArea: [Float] = []

        for i in 0...(xMin.count - 1) {
            let area = trueBoxesArea + predictedBoxesArea[i] - overlapArea[i]

            unionArea.append(area)
        }
        
        let results = zip(overlapArea, unionArea).map() { $0 / $1 }

        return results
    }
}

