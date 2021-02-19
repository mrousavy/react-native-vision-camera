import React, { useCallback } from "react";
import {
  PressableProps,
  Pressable,
  PressableStateCallbackType,
  StyleProp,
  ViewStyle,
} from "react-native";

export interface PressableOpacityProps extends PressableProps {
  /**
   * The opacity to use when `disabled={true}`
   *
   * @default 1
   */
  disabledOpacity?: number;
  /**
   * The opacity to animate to when the user presses the button
   *
   * @default 0.2
   */
  activeOpacity?: number;
}

export type StyleType = (
  state: PressableStateCallbackType
) => StyleProp<ViewStyle>;

/**
 * A Pressable component that lowers opacity when in pressed state. Uses the JS Pressability API.
 */
export const PressableOpacity = ({
  style,
  disabled = false,
  disabledOpacity = 1,
  activeOpacity = 0.2,
  ...passThroughProps
}: PressableOpacityProps): React.ReactElement => {
  const getOpacity = useCallback(
    (pressed: boolean) => {
      if (disabled) {
        return disabledOpacity;
      } else {
        if (pressed) return activeOpacity;
        else return 1;
      }
    },
    [activeOpacity, disabled, disabledOpacity]
  );
  const _style = useCallback<StyleType>(
    ({ pressed }) => [style as ViewStyle, { opacity: getOpacity(pressed) }],
    [getOpacity, style]
  );

  return <Pressable style={_style} disabled={disabled} {...passThroughProps} />;
};

// Fallback implementation using TouchableOpacity:
// export default function PressableOpacity(props: TouchableOpacityProps & { children?: React.ReactNode }): React.ReactElement {
// 	return <TouchableOpacity delayPressIn={0} {...props} />;
// }
