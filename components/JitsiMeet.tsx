import React, { useEffect, useRef, useState } from 'react';

interface JitsiMeetProps {
    roomName: string;
    displayName: string;
    onLeave?: () => void;
    containerStyle?: React.CSSProperties;
    className?: string;
}

const JitsiMeet: React.FC<JitsiMeetProps> = ({ roomName, displayName, onLeave, containerStyle, className }) => {
    const jitsiContainerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const apiRef = useRef<any>(null);

    useEffect(() => {
        // Dynamic script loading
        const loadJitsiScript = () => {
            if (window.JitsiMeetExternalAPI) {
                setLoading(false);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://meet.jit.si/external_api.js';
            script.async = true;
            script.onload = () => setLoading(false);
            document.body.appendChild(script);
        };

        loadJitsiScript();

        return () => {
            // Cleanup API on unmount
            if (apiRef.current) {
                apiRef.current.dispose();
            }
        };
    }, []);

    // Use refs for callbacks to avoid re-initializing Jitsi when they change
    const onLeaveRef = useRef(onLeave);
    useEffect(() => {
        onLeaveRef.current = onLeave;
    }, [onLeave]);

    useEffect(() => {
        if (!loading && jitsiContainerRef.current && window.JitsiMeetExternalAPI) {
            // Initialize Jitsi
            const domain = 'meet.jit.si';
            const options = {
                roomName: roomName,
                width: '100%',
                height: '100%',
                parentNode: jitsiContainerRef.current,
                userInfo: {
                    displayName: displayName
                },
                configOverwrite: {
                    startWithAudioMuted: false,
                    startWithVideoMuted: false,
                    prejoinPageEnabled: false // Skip prejoin for smoother UX
                },
                interfaceConfigOverwrite: {
                    TOOLBAR_BUTTONS: [
                        'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                        'hangup', 'profile', 'chat', 'recording',
                        'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                        'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                        'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone'
                    ],
                    SHOW_JITSI_WATERMARK: false,
                    NATIVE_APP_NAME: 'MediConnect'
                }
            };

            const api = new window.JitsiMeetExternalAPI(domain, options);
            apiRef.current = api;

            // Event Listeners
            api.addEventListeners({
                videoConferenceLeft: () => {
                    if (onLeaveRef.current) onLeaveRef.current();
                }
            });
        }
    }, [loading, roomName, displayName]); // Removed onLeave to prevent re-init

    return (
        <div className={`relative w-full h-full overflow-hidden rounded-2xl shadow-2xl bg-slate-900 ${className}`} style={containerStyle}>
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center text-white bg-slate-800">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                        <p className="font-medium text-blue-100">Loading Secure Video Link...</p>
                    </div>
                </div>
            )}
            <div ref={jitsiContainerRef} className="w-full h-full" />
        </div>
    );
};

export default JitsiMeet;
