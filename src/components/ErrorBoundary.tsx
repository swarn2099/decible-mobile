import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>App Crashed</Text>
          <ScrollView style={styles.scroll}>
            <Text style={styles.error}>
              {this.state.error?.message ?? "Unknown error"}
            </Text>
            <Text style={styles.stack}>
              {this.state.error?.stack ?? "No stack trace"}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0F",
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  title: {
    color: "#FF4D6A",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  scroll: { flex: 1 },
  error: { color: "#FFD700", fontSize: 16, marginBottom: 12 },
  stack: { color: "#FFFFFF", fontSize: 12, opacity: 0.7 },
});
