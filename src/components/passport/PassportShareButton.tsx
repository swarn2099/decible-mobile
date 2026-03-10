import React from "react";
import { Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowUpRight } from "lucide-react-native";
import { useThemeColors } from "@/constants/colors";

type Props = {
  onPress: () => void;
  loading?: boolean;
};

export function PassportShareButton({ onPress, loading = false }: Props) {
  const colors = useThemeColors();
  return (
    <Pressable onPress={onPress} disabled={loading} style={styles.wrapper}>
      <LinearGradient
        colors={[colors.purple, colors.pink]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <Text style={styles.text}>
          {loading ? "Generating..." : "Share Passport"}
        </Text>
        {!loading && <ArrowUpRight size={18} color="#FFFFFF" />}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  gradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  text: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
  },
});
