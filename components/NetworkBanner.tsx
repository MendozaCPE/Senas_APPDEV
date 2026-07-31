import NetInfo from '@react-native-community/netinfo';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NetworkBanner() {
    const [isConnected, setIsConnected] = useState<boolean>(true);
    const [isChecking, setIsChecking] = useState<boolean>(true);
    const [showRestored, setShowRestored] = useState<boolean>(false);
    
    const slideAnim = useRef(new Animated.Value(-100)).current;
    const insets = useSafeAreaInsets();
    const isFirstRender = useRef(true);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            const connected = state.isConnected ?? true;
            setIsConnected(connected);
            setIsChecking(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (isChecking) return;

        if (isFirstRender.current) {
            isFirstRender.current = false;
            if (isConnected) return; // Don't animate if connected on first load
        }

        if (!isConnected) {
            setShowRestored(false);
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 40,
                friction: 5,
            }).start();
        } else {
            setShowRestored(true);
            setTimeout(() => {
                Animated.timing(slideAnim, {
                    toValue: -100,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => setShowRestored(false));
            }, 2500);
        }
    }, [isConnected, isChecking]);

    if (isChecking) return null;

    const bannerColor = showRestored ? '#10B981' : '#EF4444'; // Green for restored, red for offline
    const bannerText = showRestored ? 'Back Online' : 'No Internet Connection';

    return (
        <Animated.View
            style={[
                styles.banner,
                {
                    backgroundColor: bannerColor,
                    paddingTop: insets.top || 20,
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <Text style={styles.text}>{bannerText}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    banner: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingBottom: 10,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        elevation: 9999,
    },
    text: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
