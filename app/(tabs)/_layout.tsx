import { Tabs } from "expo-router";
import { View, Text } from "react-native";
import { useAlertStore, useAuthStore } from "../../store";

function TabIcon({ emoji, label, focused, badge }: any) {
  return (
    <View style={{ alignItems: "center", paddingTop: 6 }}>
      <View style={{ position: "relative" }}>
        <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>{emoji}</Text>
        {badge > 0 && (
          <View style={{
            position: "absolute", top: -4, right: -8,
            backgroundColor: "#FF4D6D", borderRadius: 10,
            minWidth: 16, height: 16, alignItems: "center", justifyContent: "center",
          }}>
            <Text style={{ color: "#fff", fontSize: 9, fontWeight: "800" }}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={{
        fontSize: 10, marginTop: 3, letterSpacing: 0.5,
        color: focused ? "#6C63FF" : "#4A4A6A",
        fontWeight: focused ? "700" : "400",
      }}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const unread = useAlertStore((s) => s.unreadCount);
  const { user } = useAuthStore();
  const isHost = user?.role === "HOST";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#13131A",
          borderTopColor: "#2A2A3D",
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          href: isHost ? undefined : null,   // hide for participants
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📊" label="Dashboard" focused={focused} badge={unread} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📈" label="Analytics" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
