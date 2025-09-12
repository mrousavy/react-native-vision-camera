import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Circle } from 'react-native-svg';
import { getConnectionPoints, PoseDetectionResult, mapToViewCoordinates } from './frame-processors/PoseDetectionPlugin';

interface PoseSkeletonOverlayProps {
  poseData: PoseDetectionResult | null;
  mirrored?: boolean;
  style?: any;
  keyPointColor?: string;
  keyPointRadius?: number;
  connectionColor?: string;
  connectionWidth?: number;
  confidenceThreshold?: number;
}

/**
 * Component that renders a skeleton overlay based on pose detection results
 */
export const PoseSkeletonOverlay: React.FC<PoseSkeletonOverlayProps> = ({
  poseData,
  mirrored = false,
  style,
  keyPointColor = '#00FF00',
  keyPointRadius = 6,
  connectionColor = '#FFFF00',
  connectionWidth = 3,
  confidenceThreshold = 0.3,
}) => {
  const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
  
  // Only show the overlay when there's pose data
  if (!poseData || !poseData.keypoints || poseData.keypoints.length === 0) {
    return null;
  }
  
  // Filter keypoints based on confidence threshold
  const visibleKeypoints = poseData.keypoints.filter(
    keypoint => keypoint.confidence > confidenceThreshold
  );
  
  // Calculate the size of the overlay based on the window dimensions
  const viewWidth = style?.width || windowWidth;
  const viewHeight = style?.height || windowHeight;
  
  // Debug logs for dimensions and positioning
  console.log('=== PoseOverlay Debug Info ===');
  console.log(`[PoseOverlay] Window dimensions: ${windowWidth}x${windowHeight}`);
  console.log(`[PoseOverlay] View dimensions: ${viewWidth}x${viewHeight}`);
  console.log(`[PoseOverlay] Style props:`, JSON.stringify(style, null, 2));
  console.log(`[PoseOverlay] Source dimensions: ${poseData.sourceWidth}x${poseData.sourceHeight}`);
  console.log(`[PoseOverlay] Visible keypoints:`, visibleKeypoints.length);
  console.log(`[PoseOverlay] Container style:`, JSON.stringify(styles.container, null, 2));
  console.log(`[PoseOverlay] Parent dimensions:`, style?.width ? 'Custom size' : 'Full window');
  console.log(`[PoseOverlay] Effective dimensions: ${Math.min(viewWidth, windowWidth)}x${Math.min(viewHeight, windowHeight)}`);
  console.log(`[PoseOverlay] Aspect ratio: ${(viewHeight / viewWidth).toFixed(2)}`);
  console.log(`[PoseOverlay] Source aspect ratio: ${(poseData.sourceHeight / poseData.sourceWidth).toFixed(2)}`);
  console.log(`[PoseOverlay] Screen scale:`, Dimensions.get('window').scale);
  console.log('=== End Debug Info ===');
  
  // Create the SVG elements for the connections (lines)
  const connections = poseData.connections.map((connection, index) => {
    // Get the connection points mapped to the view coordinates
    console.log(`[PoseOverlay] Processing connection ${index}: ${connection[0]} -> ${connection[1]}`);
    const points = getConnectionPoints(
      visibleKeypoints,
      connection,
      viewWidth,
      viewHeight,
      poseData.sourceWidth,
      poseData.sourceHeight,
      mirrored
    );
    
    if (!points) {
      console.log(`[PoseOverlay] No valid points for connection ${index}`);
      return null;
    }
    
    // Apply mirroring if needed
    const fromX = mirrored ? viewWidth - points.from.x : points.from.x;
    const toX = mirrored ? viewWidth - points.to.x : points.to.x;
    
    console.log(`[PoseOverlay] Drawing connection ${index} from (${fromX}, ${points.from.y}) to (${toX}, ${points.to.y})`);
    return (
      <Line
        key={`connection-${index}`}
        x1={fromX}
        y1={points.from.y}
        x2={toX}
        y2={points.to.y}
        stroke={connectionColor}
        strokeWidth={connectionWidth}
        strokeLinecap="round"
      />
    );
  });
  
  // Filter and create SVG elements for face keypoints (eyes and nose)
  const faceKeypoints = visibleKeypoints.filter(kp => 
    ['nose', 'left_eye', 'right_eye'].includes(kp.name)
  );

  console.log(`[PoseOverlay] Found ${faceKeypoints.length} face keypoints:`, 
    faceKeypoints.map(kp => `${kp.name}(conf: ${kp.confidence.toFixed(2)})`));

  // Create the SVG elements for the keypoints (circles)
  const keypoints = faceKeypoints.map((keypoint) => {
    console.log(`[PoseOverlay] Processing face keypoint ${keypoint.name} at (${keypoint.x}, ${keypoint.y})`);
    
    // Map coordinates to view coordinates
    const { x, y } = mapToViewCoordinates(
      keypoint,
      viewWidth,
      viewHeight,
      poseData.sourceWidth,
      poseData.sourceHeight,
      mirrored
    );
    
    // Apply mirroring if needed
    const pointX = mirrored ? viewWidth - x : x;
    
    console.log(`[PoseOverlay] Drawing face keypoint ${keypoint.name} at screen coordinates (${pointX}, ${y})`);
    return (
      <Circle
        key={`keypoint-${keypoint.name}`}
        cx={pointX}
        cy={y}
        r={keyPointRadius}
        fill={keyPointColor}
        opacity={Math.min(1, keypoint.confidence * 1.5)}
      />
    );
  });

  console.log(`[PoseOverlay] Rendering overlay with dimensions: ${viewWidth}x${viewHeight}`);
  return (
    <View style={[styles.container, style]}>
      <Svg width={viewWidth} height={viewHeight} style={{zIndex: 999}}>        
        {/* Test lines for debugging */}
        {/* <Line x1={0} y1={viewHeight/2} x2={viewWidth} y2={viewHeight/2} stroke="#FF0000" strokeWidth={20} strokeOpacity={1} />
        <Line x1={viewWidth/2} y1={0} x2={viewWidth/2} y2={viewHeight} stroke="#00FF00" strokeWidth={20} strokeOpacity={1} />
        <Line x1={0} y1={0} x2={viewWidth} y2={viewHeight} stroke="#0000FF" strokeWidth={20} strokeOpacity={1} />
        <Line x1={viewWidth} y1={0} x2={0} y2={viewHeight} stroke="#FF00FF" strokeWidth={20} strokeOpacity={1} />
        

        <Circle cx={50} cy={50} r={20} fill="#FF0000" />
        <Circle cx={viewWidth - 50} cy={50} r={20} fill="#00FF00" />
        <Circle cx={viewWidth/2} cy={viewHeight/2} r={20} fill="#0000FF" />
        

        <Text x={10} y={viewHeight/2 - 10} fill="#FFFFFF" fontSize="16" stroke="#000000" strokeWidth={1}>Horizontal</Text>
        <Text x={viewWidth/2 + 10} y={20} fill="#FFFFFF" fontSize="16" stroke="#000000" strokeWidth={1}>Vertical</Text> */}
        
        {connections}
        {keypoints}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 9999,
    elevation: 9999,
    backgroundColor: 'transparent',
    pointerEvents: 'none',
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PoseSkeletonOverlay;