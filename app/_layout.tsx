import { View, Text, StyleSheet } from "react-native";

export default function RootLayout() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Decibel is alive!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0F",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#FF4D6A",
    fontSize: 24,
    fontWeight: "bold",
  },
});
