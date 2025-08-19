


import React, { useState, useRef, Suspense, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Icosahedron, Torus, Box, Dodecahedron, Octahedron, Sphere as DreiSphere, TorusKnot, Text } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import './components/logos-companion.js';
import io from 'socket.io-client';
import { TextFileViewer } from './components/TextFileViewer';

// --- Configuration ---
const OBS_BRIDGE_URL = 'http://localhost:8000';
const TRICON_CONFIG = [
    { pillar: 'SELF', color: '#ff6b6b', position: [5, 0, 0], geometry: <Icosahedron args={[0.8, 0]} /> },
    { pillar: 'THOUGHT', color: '#f0e68c', position: [3.5, 3.5, 0], geometry: <TorusKnot args={[0.7, 0.15, 100, 16]} /> },
    { pillar: 'LOGIC', color: '#74b9ff', position: [0, 5, 0], geometry: <Octahedron args={[0.8]} /> },
    { pillar: 'UNITY', color: '#a29bfe', position: [-3.5, 3.5, 0], geometry: <Dodecahedron args={[0.8, 0]} /> },
    { pillar: 'EXISTENCE', color: '#55efc4', position: [-5, 0, 0], geometry: <Box args={[1.2, 1.2, 1.2]} /> },
    { pillar: 'IMPROVEMENT', color: '#fd79a8', position: [-3.5, -3.5, 0], geometry: <TorusKnot args={[0.7, 0.2, 50, 8]} /> },
    { pillar: 'MASTERY', color: '#ffeaa7', position: [0, -5, 0], geometry: <DreiSphere args={[0.8, 32, 32]} /> },
    { pillar: 'RESONANCE', color: '#81ecec', position: [3.5, -3.5, 0], geometry: <Torus args={[0.7, 0.2, 16, 100]} /> },
];

const PILLAR_PAGE_MAP: Record<string, string> = {
    SELF: './static_site/ethics.html',
    THOUGHT: './static_site/academy_resource.01_6.12.25_12.59.am.html.html',
    LOGIC: './static_site/tutorial.html',
    UNITY: './static_site/contact.html',
    IMPROVEMENT: './static_site/blog.html',
    MASTERY: './static_site/nexus.html',
    RESONANCE: './components/Case Study A Novel Human-AI Symbios.txt',
    TRANSCENDENCE: './static_site/Industry Trends & Market Research AI Assistants.html',
};

// --- Components ---

function LoadingSplash({ onFinished }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const splashRef = useRef<HTMLDivElement>(null);

    const handleVideoEnd = () => {
        if (splashRef.current) {
            splashRef.current.classList.add('hidden');
            // Wait for fade out transition before notifying parent
            setTimeout(onFinished, 500); 
        }
    };

    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            video.addEventListener('ended', handleVideoEnd);
            video.play().catch(error => {
                console.warn("Video autoplay prevented:", error);
                // If autoplay fails, end splash after a delay
                setTimeout(handleVideoEnd, 2000); 
            });
        }
        return () => {
            if (video) {
                video.removeEventListener('ended', handleVideoEnd);
            }
        };
    }, [onFinished]);

    return (
        <div ref={splashRef} className="loading-splash">
            <video ref={videoRef} muted playsInline src="./Clay_Animation_to_.mp4" />
        </div>
    );
}


function PulsingSphere({ onNavigate }) {
    const ref = useRef<THREE.Mesh>(null!);
    useFrame(({ clock }) => {
        if (!ref.current) return;
        const pulse = (Math.sin(clock.getElapsedTime() * 0.5) + 1) / 2;
        (ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse * 0.5 + 0.1;
    });
    return (
        <DreiSphere ref={ref} args={[1.5, 64, 64]} onClick={() => onNavigate({ position: [0,0,0], color: '#ffffff', pillar: 'TRANSCENDENCE'})}>
            <meshStandardMaterial color="#151515" emissive="white" roughness={0.4} metalness={0.2} />
        </DreiSphere>
    );
}

function Tricon({ config, onNavigate }) {
    const ref = useRef<THREE.Mesh>(null!);
    const textRef = useRef<any>(null!);
    const [hovered, setHover] = useState(false);

    useFrame(() => {
        if (!ref.current) return;
        ref.current.rotation.y += 0.005;
        ref.current.rotation.x += 0.002;
    });

    useEffect(() => {
        if (textRef.current) {
            gsap.to(textRef.current.material, {
                opacity: hovered ? 1 : 0,
                duration: 0.3,
                ease: 'power1.inOut'
            });
        }
    }, [hovered]);

    const handleClick = () => {
        onNavigate({ position: config.position, color: config.color, pillar: config.pillar });
    };

    return (
        <group position={config.position}>
            <mesh
                ref={ref}
                onPointerOver={() => { document.body.style.cursor = 'pointer'; setHover(true); }}
                onPointerOut={() => { document.body.style.cursor = 'auto'; setHover(false); }}
                onClick={handleClick}
            >
                {config.geometry}
                <meshStandardMaterial color={config.color} emissive={config.color} emissiveIntensity={hovered ? 0.8 : 0.3} roughness={0.5} metalness={0.5} />
            </mesh>
            <Text
                ref={textRef}
                position={[0, -1.2, 0]}
                fontSize={0.4}
                color={config.color}
                anchorX="center"
                anchorY="middle"
            >
                {config.pillar}
                <meshBasicMaterial transparent opacity={0} color={config.color} />
            </Text>
        </group>
    );
}

function CameraRig({ navTarget, onAnimationComplete, setControlsEnabled }) {
    const { camera, controls } = useThree();

    useEffect(() => {
        if (navTarget) {
            setControlsEnabled(false);
            const targetPosition = new THREE.Vector3().fromArray(navTarget.position);
            const finalPosition = new THREE.Vector3(targetPosition.x * 0.2, targetPosition.y * 0.2, 4);

            const tl = gsap.timeline({
                onComplete: () => {
                    onAnimationComplete(navTarget);
                }
            });

            tl.to(camera.position, {
                x: targetPosition.x,
                y: targetPosition.y,
                z: 10,
                duration: 1,
                ease: 'power2.inOut',
                onUpdate: () => (controls as any)?.target.copy(targetPosition)
            });
            
            tl.to(camera.position, {
                x: finalPosition.x,
                y: finalPosition.y,
                z: finalPosition.z,
                duration: 1,
                ease: 'power3.in',
            }, ">-0.2");
            
            tl.to((controls as any).target, {
                x: 0,
                y: 0,
                z: 0,
                duration: 1,
                ease: 'power3.inOut'
            }, "<");
        }
    }, [navTarget, controls, onAnimationComplete, setControlsEnabled]);

    return null;
}

function VisualCortexViewer() {
    const [logs, setLogs] = useState<{ type: 'log' | 'status' | 'error', message: string, timestamp?: string }[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const socket = io(OBS_BRIDGE_URL);
        
        const addLog = (log) => setLogs(prev => [...prev.slice(-100), log]);

        socket.on('connect', () => {
            setIsConnected(true);
            addLog({ type: 'status', message: `Connected to Visual Cortex at ${OBS_BRIDGE_URL}` });
        });
        socket.on('disconnect', () => {
            setIsConnected(false);
            addLog({ type: 'error', message: 'Disconnected from Visual Cortex.' });
        });
        socket.on('new_context', (data) => {
            addLog({ type: 'log', message: data.text, timestamp: data.timestamp });
        });
        socket.on('api_error', (data) => {
            addLog({ type: 'error', message: `API Error: ${data.message}`, timestamp: data.timestamp });
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="visual-cortex-viewer">
            <div className="visual-cortex-header">
                <h3>Visual Cortex Feed</h3>
                <div className={`status-indicator ${isConnected ? 'connected' : ''}`}>
                    {isConnected ? '● LIVE' : '● DISCONNECTED'}
                </div>
            </div>
            <div className="visual-cortex-logs" ref={logContainerRef}>
                {logs.map((log, index) => (
                    <div key={index} className={`log-entry ${log.type}`}>
                        {log.timestamp && <span className="log-timestamp">{log.timestamp}</span>}
                        <span className="log-message">{log.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Scene() {
    const [isLoading, setIsLoading] = useState(true);
    const [navTarget, setNavTarget] = useState(null);
    const [pageContent, setPageContent] = useState({ pillar: '', color: 'black', pageUrl: '' });
    const [isPageVisible, setPageVisible] = useState(false);
    const [controlsEnabled, setControlsEnabled] = useState(true);
    const overlayRef = useRef<HTMLDivElement>(null);

    const handleNavigate = (target) => {
        if (navTarget || isPageVisible) return;
        setNavTarget(target);
    };

    const handleAnimationComplete = (target) => {
        if (overlayRef.current) {
            overlayRef.current.style.backgroundColor = target.color;
            overlayRef.current.style.opacity = '1';
        }
        
        const pageUrl = PILLAR_PAGE_MAP[target.pillar] || './static_site/nexus.html';

        setTimeout(() => {
            setPageContent({ pillar: target.pillar, color: target.color, pageUrl: pageUrl });
            setPageVisible(true);
            setNavTarget(null);
            if (overlayRef.current) {
                overlayRef.current.style.opacity = '0';
            }
        }, 800);
    };

    const handleReturnToNexus = () => {
        setPageVisible(false);
        setTimeout(() => {
            setControlsEnabled(true);
        }, 500);
    };

    if (isLoading) {
        return <LoadingSplash onFinished={() => setIsLoading(false)} />;
    }

    return (
        <>
            <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={1.5} />
                <Suspense fallback={null}>
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                    <PulsingSphere onNavigate={handleNavigate} />
                    {TRICON_CONFIG.map(config => (
                        <Tricon key={config.pillar} config={config} onNavigate={handleNavigate} />
                    ))}
                </Suspense>
                <OrbitControls enabled={controlsEnabled} minDistance={5} maxDistance={25} />
                {!isPageVisible && <CameraRig navTarget={navTarget} onAnimationComplete={handleAnimationComplete} setControlsEnabled={setControlsEnabled} />}
            </Canvas>
            <div ref={overlayRef} className="transition-overlay"></div>
             <div className={`content-page ${isPageVisible ? 'visible' : ''}`}>
                <div className="content-wrapper">
                    <div className="realm-header">
                        <button onClick={handleReturnToNexus} className="back-button">
                            ← Back to Nexus
                        </button>
                        <h1 style={{ borderColor: pageContent.color, color: pageContent.color, textShadow: `0 0 10px ${pageContent.color}` }}>
                            {pageContent.pillar} Realm
                        </h1>
                    </div>

                    {pageContent.pillar === 'EXISTENCE' ? (
                        <div className="realm-content-area-full">
                            <VisualCortexViewer />
                        </div>
                    ) : (
                        <>
                            <div className="realm-content-viewer">
                                {pageContent.pageUrl.endsWith('.txt') ? (
                                    <TextFileViewer url={pageContent.pageUrl} />
                                ) : (
                                    <iframe src={pageContent.pageUrl} title={`${pageContent.pillar} Content`} className="realm-iframe" />
                                )}
                            </div>
                            <div className="companion-container">
                                <logos-companion></logos-companion>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<React.StrictMode><Scene /></React.StrictMode>);
}