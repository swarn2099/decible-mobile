import { useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { useRouter } from "expo-router";
import { Ticket, Star, MapPin } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/colors";
import { useUIStore } from "@/stores/uiStore";

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    icon: Ticket,
    iconColor: Colors.pink,
    glowColor: Colors.pink,
    title: "Your Live Music Passport",
    subtitle:
      "Track every show. Collect every artist. Build your music identity.",
  },
  {
    icon: Star,
    iconColor: Colors.yellow,
    glowColor: Colors.yellow,
    title: "Be the Founder",
    subtitle:
      "Discover underground artists before anyone else. Paste a link from Spotify, Apple Music, or SoundCloud to claim your Founder badge.",
  },
  {
    icon: MapPin,
    iconColor: Colors.pink,
    glowColor: Colors.pink,
    title: "Stamp Your Passport",
    subtitle:
      "When you're at a show, check in to collect the artists and build your live music diary.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const setOnboardingComplete = useUIStore((s) => s.setOnboardingComplete);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentPage(page);
  };

  const handleNext = () => {
    if (currentPage < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({
        x: (currentPage + 1) * width,
        animated: true,
      });
    } else {
      finish();
    }
  };

  const finish = () => {
    setOnboardingComplete();
    router.replace("/(auth)/login");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0B0F" }}>
      {/* Skip */}
      <TouchableOpacity
        onPress={finish}
        activeOpacity={0.7}
        style={{
          position: "absolute",
          top: 60,
          right: 24,
          zIndex: 10,
          paddingVertical: 6,
          paddingHorizontal: 12,
        }}
      >
        <Text
          style={{
            fontFamily: "Poppins_500Medium",
            fontSize: 15,
            color: "rgba(255,255,255,0.5)",
          }}
        >
          Skip
        </Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        bounces={false}
      >
        {SLIDES.map((slide, index) => {
          const Icon = slide.icon;
          return (
            <View
              key={index}
              style={{
                width,
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 40,
              }}
            >
              {/* DECIBEL branding at top */}
              {index === 0 && (
                <Text
                  style={{
                    fontFamily: "Poppins_700Bold",
                    fontSize: 14,
                    letterSpacing: 6,
                    color: "rgba(255,255,255,0.3)",
                    position: "absolute",
                    top: height * 0.15,
                  }}
                >
                  DECIBEL
                </Text>
              )}

              {/* Icon circle with glow */}
              <View
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: `${slide.glowColor}15`,
                  borderWidth: 1,
                  borderColor: `${slide.glowColor}30`,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 40,
                  shadowColor: slide.glowColor,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.3,
                  shadowRadius: 20,
                }}
              >
                <Icon size={56} color={slide.iconColor} strokeWidth={1.5} />
              </View>

              {/* Title */}
              <Text
                style={{
                  fontFamily: "Poppins_700Bold",
                  fontSize: 26,
                  color: "#FFFFFF",
                  textAlign: "center",
                  marginBottom: 12,
                  lineHeight: 34,
                }}
              >
                {slide.title}
              </Text>

              {/* Subtitle */}
              <Text
                style={{
                  fontFamily: "Poppins_400Regular",
                  fontSize: 15,
                  color: "rgba(255,255,255,0.55)",
                  textAlign: "center",
                  lineHeight: 22,
                }}
              >
                {slide.subtitle}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom: dots + button */}
      <View style={{ paddingBottom: 50, paddingHorizontal: 24 }}>
        {/* Page dots */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 28,
          }}
        >
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={{
                height: 8,
                borderRadius: 4,
                marginHorizontal: 4,
                width: index === currentPage ? 28 : 8,
                backgroundColor:
                  index === currentPage
                    ? Colors.pink
                    : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </View>

        {/* Next / Get Started button */}
        <TouchableOpacity onPress={handleNext} activeOpacity={0.85}>
          <LinearGradient
            colors={
              currentPage === SLIDES.length - 1
                ? [Colors.pink, Colors.purple]
                : [Colors.pink, Colors.pink]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "Poppins_700Bold",
                fontSize: 16,
                color: "#FFFFFF",
              }}
            >
              {currentPage === SLIDES.length - 1 ? "Get Started" : "Next"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}
