import { useState } from "react";
import { View, Text, TextInput, type KeyboardTypeOptions } from "react-native";
import { useThemeColors } from "@/constants/colors";

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
  autoFocus?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  maxLength?: number;
  textAlign?: "left" | "center" | "right";
  letterSpacing?: number;
  fontSize?: number;
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  error,
  autoFocus,
  autoCapitalize,
  maxLength,
  textAlign = "left",
  letterSpacing,
  fontSize,
}: InputProps) {
  const colors = useThemeColors();
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? colors.pink
    : isFocused
      ? colors.pink
      : colors.lightGray;

  return (
    <View style={{ width: "100%" }}>
      {label && (
        <Text
          style={{
            fontFamily: "Poppins_500Medium",
            color: colors.gray,
            fontSize: 14,
            marginBottom: 8,
          }}
        >
          {label}
        </Text>
      )}
      <TextInput
        style={{
          backgroundColor: colors.card,
          color: colors.text,
          fontFamily: "Poppins_400Regular",
          borderRadius: 12,
          height: 56,
          paddingHorizontal: 16,
          borderWidth: 1,
          borderColor,
          textAlign,
          ...(letterSpacing != null ? { letterSpacing } : {}),
          ...(fontSize != null ? { fontSize } : {}),
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.lightGray}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoFocus={autoFocus}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {error && (
        <Text
          style={{
            fontFamily: "Poppins_400Regular",
            color: colors.pink,
            fontSize: 14,
            marginTop: 4,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
