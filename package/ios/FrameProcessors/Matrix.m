//
//  Matrix.m
//  VisionCamera
//
//  Created by Marc Rousavy on 10.06.24.
//

#import <Foundation/Foundation.h>
#import "Matrix.h"
#import <simd/simd.h>

@implementation MatrixRow {
  simd_float3 _vector;
  NSUInteger _size;
}

- (nonnull instancetype)initWithVector:(simd_float3)vector ofSize:(NSUInteger)size {
  if (self = [super init]) {
    _vector = vector;
    _size = size;
  }
  return self;
}

- (float)valueAtIndex:(NSUInteger)index {
  if (index >= _size) {
    @throw [NSError errorWithDomain:@"Index cannot be greater than size of matrix row!" code:-1 userInfo:nil];
  }
  return _vector[index];
}

- (NSUInteger)size {
  return _size;
}

@end

@implementation Matrix {
  NSArray<MatrixRow*>* _rows;
}

- (nonnull instancetype)initWithSIMDMatrix:(matrix_float3x3)matrix {
  if (self = [super init]) {
    _rows = @[
      [[MatrixRow alloc] initWithVector:matrix.columns[0] ofSize:3],
      [[MatrixRow alloc] initWithVector:matrix.columns[1] ofSize:3],
      [[MatrixRow alloc] initWithVector:matrix.columns[2] ofSize:3],
    ];
  }
  return self;
}

- (nonnull NSArray<MatrixRow *> *)rows {
  return _rows;
}

- (NSUInteger) totalSize {
  // 3 x 3
  return _rows.count * _rows[0].size;
}

+ (nonnull Matrix *)identityMatrix {
  static Matrix* identity = nil;
  if (identity == nil) {
    matrix_float3x3 floatIdentityMatrix = (matrix_float3x3) {
      .columns = {
        {1.0f, 0.0f, 0.0f},
        {0.0f, 1.0f, 0.0f},
        {0.0f, 0.0f, 1.0f}
      }
    };
    identity = [[Matrix alloc] initWithSIMDMatrix:floatIdentityMatrix];
  }
  return identity;
}

@end
