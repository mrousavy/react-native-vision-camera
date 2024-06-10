//
//  Matrix.h
//  Pods
//
//  Created by Marc Rousavy on 10.06.24.
//

#pragma once

#import <Foundation/Foundation.h>
#import <simd/matrix_types.h>
#import <simd/vector_types.h>

NS_ASSUME_NONNULL_BEGIN

@interface MatrixRow : NSObject
- (NSUInteger) size;
- (float) valueAtIndex:(NSUInteger)index;

- (instancetype) initWithVector:(simd_float3)vector ofSize:(NSUInteger)size;
@end

@interface Matrix : NSObject
+ (Matrix*) identityMatrix;
- (NSArray<MatrixRow*>*) rows;
- (NSUInteger) totalSize;

- (instancetype) initWithSIMDMatrix:(matrix_float3x3)matrix;
@end

NS_ASSUME_NONNULL_END
