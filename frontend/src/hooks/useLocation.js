import { useState, useEffect } from "react";
import * as Location from "expo-location";

export default function useLocation() {
    const [location, setLocation] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        async function getLocation() {
            const { status } = await Location.requestForegroundPermissionsAsync();
            
            if (status !== 'granted') {
                setErrorMsg('Permission denied');
                return;
            }

            const current = await Location.getCurrentPositionAsync({});
            setLocation(current);
        }

        getLocation();
    }, []);

    return { location, errorMsg };
}