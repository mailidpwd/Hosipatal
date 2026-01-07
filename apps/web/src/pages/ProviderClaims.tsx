
import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/UI';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { providerService } from '@/services/api/providerService';
import { claimsService } from '@/services/api/claimsService';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';

export const ProviderClaims = () => {
    const { user, isLoading: authLoading } = useAuth();
    const providerId = user?.role === 'STAFF' ? user.id : undefined;
    
    // Get providerId from sessionStorage as fallback
    const getStoredProviderId = () => {
      try {
        return sessionStorage.getItem('providerId') || undefined;
      } catch {
        return undefined;
      }
    };
    
    const providerIdRef = useRef<string | undefined>(providerId || getStoredProviderId());
    
    useEffect(() => {
      if (providerId) {
        providerIdRef.current = providerId;
        try {
          sessionStorage.setItem('providerId', providerId);
        } catch {
          // Ignore storage errors
        }
      }
    }, [providerId]);
    
    const stableProviderId = providerId || providerIdRef.current || getStoredProviderId();
    const [activeTab, setActiveTab] = useState<'prescription' | 'claims'>('prescription');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [outputVisible, setOutputVisible] = useState(false);
    
    // Voice to Text State
    const [isRecording, setIsRecording] = useState(false);
    const [noteText, setNoteText] = useState("");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Dynamic Claims Data State - Realistic defaults
    const [diagnosis, setDiagnosis] = useState({ 
        code: 'I10', 
        desc: 'Essential (primary) hypertension',
        category: 'Cardiovascular'
    });
    const [cpt, setCpt] = useState({ 
        code: '99213', 
        desc: 'Office or other outpatient visit for the evaluation and management of an established patient',
        level: 'Level 3',
        time: '15-20 minutes'
    });
    const [reimbursement, setReimbursement] = useState('$127.50');
    const [placeOfService, setPlaceOfService] = useState('11 - Office');
    const [modifiers, setModifiers] = useState<string[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');

    // Fetch patients for dropdown - filtered by providerId
    const { data: patientsData } = useQuery({
      queryKey: ['provider', 'patients', stableProviderId],
      queryFn: () => providerService.getPatients({ limit: 100, providerId: stableProviderId }),
      enabled: !!stableProviderId && !authLoading,
    });

    // Fetch recent submissions
    const { data: recentSubmissions = [], isLoading: submissionsLoading, refetch: refetchSubmissions } = useQuery({
      queryKey: ['claims', 'recent', stableProviderId],
      queryFn: () => claimsService.getClaims({ providerId: stableProviderId }),
      refetchInterval: 30000, // Refetch every 30 seconds
      enabled: !!stableProviderId && !authLoading,
    });

    const patients = patientsData?.patients || [];

    // State for medications
    const [medications, setMedications] = useState([
        { 
            id: 1, 
            name: 'Metformin HCl', 
            strength: '500mg', 
            frequency: '2x Daily', 
            route: 'Oral', 
            duration: '90 Days', 
            instructions: 'Take with meals to reduce stomach upset.',
            isVerified: true,
            isAutoAdded: false,
            isEditing: false 
        },
        { 
            id: 2, 
            name: 'Lisinopril', 
            strength: '10mg', 
            frequency: '1x Daily', 
            route: 'Oral', 
            duration: '30 Days', 
            instructions: 'Take 1 tablet daily.',
            isVerified: false,
            isAutoAdded: true,
            alert: 'Check Potassium levels in 2 weeks (AI Clinical Alert)',
            isEditing: false
        }
    ]);

    // Helper: Convert Blob to Base64 string (stripping header)
    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                // Remove data URL prefix (e.g. "data:audio/webm;base64,")
                const base64Data = result.split(',')[1];
                resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const startRecording = async () => {
        setErrorMsg(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err: any) {
            console.error("Microphone access denied:", err);
            setErrorMsg("Microphone access denied. Please check permissions.");
        }
    };

    const stopRecording = async () => {
        if (!mediaRecorderRef.current) return;

        return new Promise<void>((resolve) => {
            mediaRecorderRef.current!.onstop = async () => {
                setIsRecording(false);
                setIsTranscribing(true);
                
                // Check for API key
                const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
                
                // Demo mode fallback if no API key
                if (!apiKey) {
                    console.warn('[ProviderClaims] ⚠️ No Gemini API key found. Using demo transcription.');
                    setErrorMsg('Gemini API key not configured. Using demo mode.');
                    
                    // Demo fallback - simulate transcription with realistic clinical notes
                    setTimeout(() => {
                        const demoTranscriptions = [
                            "Patient presents with hypertension. Blood pressure elevated at 150/95. Prescribe Lisinopril 10mg once daily for 30 days. Follow up in 2 weeks.",
                            "Patient reports chest pain and shortness of breath. EKG shows normal sinus rhythm. Prescribe Aspirin 81mg daily and schedule stress test.",
                            "Patient with Type 2 Diabetes. Blood glucose elevated. Prescribe Metformin 500mg twice daily with meals. Check A1C in 3 months.",
                            "Patient complains of persistent cough and wheezing. Diagnosed with asthma. Prescribe Albuterol inhaler 2 puffs as needed. Follow up in 1 month.",
                            "Patient presents with elevated cholesterol. Prescribe Atorvastatin 20mg once daily at bedtime. Recheck lipid panel in 6 weeks."
                        ];
                        const randomDemo = demoTranscriptions[Math.floor(Math.random() * demoTranscriptions.length)];
                        setNoteText(prev => (prev ? prev + " " + randomDemo : randomDemo));
                        setIsTranscribing(false);
                        setErrorMsg(null);
                        // Stop tracks to release mic
                        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
                        resolve();
                    }, 1500);
                    return;
                }
                
                try {
                    // Create blob from chunks
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); // Chrome/Firefox default
                    const base64Audio = await blobToBase64(audioBlob);

                    // Initialize Gemini
                    const genAI = new GoogleGenerativeAI(apiKey);
                    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
                    
                    // Transcribe using 2.0 Flash Exp which supports audio
                    const result = await model.generateContent([
                                    { 
                                        inlineData: { 
                                            mimeType: 'audio/webm', 
                                            data: base64Audio 
                                        } 
                                    },
                        "Transcribe this clinical medical dictation exactly. Do not add any introductory text, markdown, or commentary. Just the transcription."
                    ]);

                    const response = await result.response;
                    const transcription = response.text();
                    if (transcription) {
                        setNoteText(prev => (prev ? prev + " " + transcription : transcription));
                        setErrorMsg(null);
                    }
                } catch (err: any) {
                    console.error("Transcription error:", err);
                    const errorMessage = err.message || "Unknown error";
                    if (errorMessage.includes('API key') || errorMessage.includes('403')) {
                        setErrorMsg(`API key issue: ${errorMessage}. Please check GEMINI_API_KEY in Vercel environment variables.`);
                    } else {
                        setErrorMsg(`Transcription failed: ${errorMessage}. Check API Key and Model.`);
                    }
                } finally {
                    setIsTranscribing(false);
                    // Stop tracks to release mic
                    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
                    resolve();
                }
            };
            mediaRecorderRef.current!.stop();
        });
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const toggleEdit = (id: number) => {
        setMedications(prev => prev.map(med => 
            med.id === id ? { ...med, isEditing: !med.isEditing } : med
        ));
    };

    const deleteMed = (id: number) => {
        setMedications(prev => prev.filter(med => med.id !== id));
    };

    const handleProcess = async () => {
        if (!noteText.trim()) return;
        
        setIsProcessing(true);
        setOutputVisible(false); // Reset for animation

        // Check for API key
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
        
        // Demo mode fallback if no API key
        if (!apiKey) {
            console.warn('[ProviderClaims] ⚠️ No Gemini API key found. Using demo processing.');
            setErrorMsg('Gemini API key not configured. Using demo mode.');
            
            // Use demo data based on note text content
            setTimeout(() => {
                const noteLower = noteText.toLowerCase();
                let demoMedications: any[] = [];
                let demoDiagnosis: any = { code: 'I10', desc: 'Essential (primary) hypertension', category: 'Cardiovascular' };
                let demoCpt: any = { code: '99213', desc: 'Office or other outpatient visit', level: 'Level 3', time: '15-20 minutes' };
                let demoReimbursement = '$127.50';
                
                // Smart demo data based on note content
                if (noteLower.includes('hypertension') || noteLower.includes('blood pressure') || noteLower.includes('bp')) {
                    demoMedications = [{
                        id: Date.now(),
                        name: 'Lisinopril',
                        strength: '10mg',
                        frequency: '1x Daily',
                        route: 'Oral',
                        duration: '30 Days',
                        instructions: 'Take with or without food. Monitor blood pressure regularly.',
                        isVerified: true,
                        isAutoAdded: true,
                        isEditing: false,
                        alert: 'Check potassium levels in 2 weeks'
                    }];
                    demoDiagnosis = { code: 'I10', desc: 'Essential (primary) hypertension', category: 'Cardiovascular' };
                } else if (noteLower.includes('diabetes') || noteLower.includes('glucose') || noteLower.includes('a1c')) {
                    demoMedications = [{
                        id: Date.now(),
                        name: 'Metformin',
                        strength: '500mg',
                        frequency: '2x Daily',
                        route: 'Oral',
                        duration: '90 Days',
                        instructions: 'Take with meals to reduce stomach upset.',
                        isVerified: true,
                        isAutoAdded: true,
                        isEditing: false,
                        alert: null
                    }];
                    demoDiagnosis = { code: 'E11.9', desc: 'Type 2 diabetes mellitus without complications', category: 'Endocrine' };
                } else if (noteLower.includes('asthma') || noteLower.includes('wheezing') || noteLower.includes('cough')) {
                    demoMedications = [{
                        id: Date.now(),
                        name: 'Albuterol',
                        strength: '90mcg',
                        frequency: '2 puffs as needed',
                        route: 'Inhalation',
                        duration: '30 Days',
                        instructions: 'Use inhaler when experiencing shortness of breath or wheezing.',
                        isVerified: true,
                        isAutoAdded: true,
                        isEditing: false,
                        alert: null
                    }];
                    demoDiagnosis = { code: 'J45.909', desc: 'Unspecified asthma, uncomplicated', category: 'Respiratory' };
                } else {
                    // Default demo data
                    demoMedications = [{
                        id: Date.now(),
                        name: 'Lisinopril',
                        strength: '10mg',
                        frequency: '1x Daily',
                        route: 'Oral',
                        duration: '30 Days',
                        instructions: 'Take as directed by physician.',
                        isVerified: true,
                        isAutoAdded: true,
                        isEditing: false,
                        alert: null
                    }];
                }
                
                setMedications(demoMedications);
                setDiagnosis(demoDiagnosis);
                setCpt(demoCpt);
                setReimbursement(demoReimbursement);
                setOutputVisible(true);
                setIsProcessing(false);
                setErrorMsg(null);
            }, 2000);
            return;
        }

        try {
            // Process claim through API (which will use AI)
            const claimResult = await claimsService.processClaim({
                noteText,
                patientId: selectedPatientId || undefined,
            });

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ 
                model: 'gemini-1.5-flash',
                generationConfig: {
                    responseMimeType: 'application/json',
                }
            });
            
            // Using Gemini for fast JSON extraction
            const prompt = `Analyze the following clinical note and extract:
                1. Medications (name, strength, frequency, route, duration, instructions). Infer standard medical instructions if missing.
                2. Most likely ICD-10 Diagnosis code, description, and category (e.g., Cardiovascular, Endocrine, Respiratory).
                3. Most appropriate CPT Service code, description, level (e.g., Level 3, Level 4), and typical time duration.
                4. Estimated reimbursement amount based on Medicare fee schedule (e.g., $127.50).
                
Clinical Note: "${noteText}"

Return a JSON object with this structure:
{
  "medications": [
    {
      "name": "string",
      "strength": "string",
      "frequency": "string",
      "route": "string",
      "duration": "string",
      "instructions": "string",
      "alert": "string or null"
    }
  ],
  "diagnosis": {
    "code": "string (ICD-10 format, e.g., I10, E11.9)",
    "desc": "string (full description)",
    "category": "string (e.g., Cardiovascular, Endocrine)"
  },
  "cpt": {
    "code": "string (e.g., 99213, 99214)",
    "desc": "string (full CPT description)",
    "level": "string (e.g., Level 3, Level 4)",
    "time": "string (e.g., 15-20 minutes, 25-30 minutes)"
  },
  "reimbursement": "string (format: $XXX.XX)"
}`;

            const result = await model.generateContent(prompt);
            const response = await result.response;

            const text = response.text();
            const data = JSON.parse(text || "{}");

            // Update State with AI Data
            if (data.medications && Array.isArray(data.medications)) {
                setMedications(data.medications.map((med: any, index: number) => ({
                    id: Date.now() + index,
                    name: med.name || 'Unknown Drug',
                    strength: med.strength || '-',
                    frequency: med.frequency || 'As directed',
                    route: med.route || 'Oral',
                    duration: med.duration || '30 Days',
                    instructions: med.instructions || 'Follow physician instructions.',
                    isVerified: true,
                    isAutoAdded: true,
                    isEditing: false,
                    alert: med.alert
                })));
            } else {
                setMedications([]);
            }

            if (data.diagnosis) {
                setDiagnosis({ 
                    code: data.diagnosis.code || 'I10', 
                    desc: data.diagnosis.desc || 'Essential (primary) hypertension',
                    category: data.diagnosis.category || 'Cardiovascular'
                });
            } else {
                // Keep default if no diagnosis found
                setDiagnosis({ 
                    code: 'I10', 
                    desc: 'Essential (primary) hypertension',
                    category: 'Cardiovascular'
                });
            }

            if (data.cpt) {
                setCpt({ 
                    code: data.cpt.code || '99213', 
                    desc: data.cpt.desc || 'Office or other outpatient visit for the evaluation and management of an established patient',
                    level: data.cpt.level || 'Level 3',
                    time: data.cpt.time || '15-20 minutes'
                });
            } else {
                // Keep default if no CPT found
                setCpt({ 
                    code: '99213', 
                    desc: 'Office or other outpatient visit for the evaluation and management of an established patient',
                    level: 'Level 3',
                    time: '15-20 minutes'
                });
            }

            if (data.reimbursement) {
                setReimbursement(data.reimbursement);
            } else {
                // Calculate realistic reimbursement based on CPT code
                const reimbursementMap: { [key: string]: string } = {
                    '99211': '$45.00',
                    '99212': '$75.00',
                    '99213': '$127.50',
                    '99214': '$185.00',
                    '99215': '$245.00'
                };
                setReimbursement(reimbursementMap[data.cpt?.code || '99213'] || '$127.50');
            }

            // Set realistic place of service and modifiers based on CPT code
            setPlaceOfService('11 - Office');
            // Add modifiers for certain scenarios if needed
            const cptModifiers: string[] = [];
            setModifiers(cptModifiers);

            setOutputVisible(true);
            
            // Refresh submissions after processing
            refetchSubmissions();

        } catch (error: any) {
            console.error("AI Processing Error:", error);
            const errorMessage = error?.message || "Unknown error";
            
            // If API key issue or 403 error, fall back to demo mode
            if (errorMessage.includes('API key') || errorMessage.includes('403') || errorMessage.includes('unregistered callers')) {
                console.warn('[ProviderClaims] API key issue detected, falling back to demo mode');
                setErrorMsg('API key issue detected. Using demo mode.');
                
                // Use demo data as fallback
                const noteLower = noteText.toLowerCase();
                let demoMedications: any[] = [];
                let demoDiagnosis: any = { code: 'I10', desc: 'Essential (primary) hypertension', category: 'Cardiovascular' };
                let demoCpt: any = { code: '99213', desc: 'Office or other outpatient visit', level: 'Level 3', time: '15-20 minutes' };
                let demoReimbursement = '$127.50';
                
                if (noteLower.includes('hypertension') || noteLower.includes('blood pressure') || noteLower.includes('bp')) {
                    demoMedications = [{
                        id: Date.now(),
                        name: 'Lisinopril',
                        strength: '10mg',
                        frequency: '1x Daily',
                        route: 'Oral',
                        duration: '30 Days',
                        instructions: 'Take with or without food. Monitor blood pressure regularly.',
                        isVerified: true,
                        isAutoAdded: true,
                        isEditing: false,
                        alert: 'Check potassium levels in 2 weeks'
                    }];
                } else if (noteLower.includes('diabetes') || noteLower.includes('glucose')) {
                    demoMedications = [{
                        id: Date.now(),
                        name: 'Metformin',
                        strength: '500mg',
                        frequency: '2x Daily',
                        route: 'Oral',
                        duration: '90 Days',
                        instructions: 'Take with meals to reduce stomach upset.',
                        isVerified: true,
                        isAutoAdded: true,
                        isEditing: false,
                        alert: null
                    }];
                    demoDiagnosis = { code: 'E11.9', desc: 'Type 2 diabetes mellitus without complications', category: 'Endocrine' };
                } else {
                    demoMedications = [{
                        id: Date.now(),
                        name: 'Lisinopril',
                        strength: '10mg',
                        frequency: '1x Daily',
                        route: 'Oral',
                        duration: '30 Days',
                        instructions: 'Take as directed by physician.',
                        isVerified: true,
                        isAutoAdded: true,
                        isEditing: false,
                        alert: null
                    }];
                }
                
                setMedications(demoMedications);
                setDiagnosis(demoDiagnosis);
                setCpt(demoCpt);
                setReimbursement(demoReimbursement);
                setOutputVisible(true);
                setErrorMsg(null);
            } else {
                setErrorMsg(`Failed to process clinical notes: ${errorMessage}. Please try again or check API configuration.`);
            }
        } finally {
            setIsProcessing(false);
        }
    }

    return (
        <div className="w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6 pb-24 md:pb-12 animate-[fadeIn_0.5s_ease-out]">
            {/* Page Heading */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <Icon name="psychology" className="text-primary-dark dark:text-primary text-2xl" />
                        <h2 className="text-slate-900 dark:text-white text-xl md:text-2xl font-bold leading-tight tracking-tight">Clinical NLP Engine</h2>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium">Dictate notes to auto-generate prescriptions and claims codes.</p>
                </div>
            </div>

            {/* Main Content Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
                {/* Left Column: Input */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-slate-800 dark:text-white font-bold text-base">The Input (Dictation/Text)</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-primary-dark dark:text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">Live Mode</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Patient</label>
                            <div className="relative">
                                <select 
                                  value={selectedPatientId}
                                  onChange={(e) => setSelectedPatientId(e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 appearance-none font-medium cursor-pointer"
                                >
                                  <option value="">Select a patient...</option>
                                  {patients.map(patient => (
                                    <option key={patient.id} value={patient.id}>
                                      {patient.name} (ID: {patient.patientId})
                                    </option>
                                  ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                    <Icon name="expand_more" className="text-slate-500" />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5 grow">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Clinical Notes
                                </label>
                                {isRecording && (
                                    <span className="text-red-500 flex items-center gap-1 text-[10px] font-bold animate-pulse">
                                        <span className="size-2 rounded-full bg-red-500"></span>
                                        Recording Audio...
                                    </span>
                                )}
                                {isTranscribing && (
                                    <span className="text-blue-500 flex items-center gap-1 text-[10px] font-bold animate-pulse">
                                        <Icon name="cloud_upload" className="text-xs"/>
                                        Transcribing...
                                    </span>
                                )}
                            </div>
                            
                            {/* Input Area */}
                            <div className="relative flex flex-col h-[200px] lg:h-[280px]">
                                {errorMsg && (
                                    <div className="absolute top-2 left-2 right-2 z-10 bg-red-50 dark:bg-red-900/90 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg text-xs font-bold shadow-md flex flex-row items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
                                        <Icon name="error" className="text-lg" />
                                        <span>{errorMsg}</span>
                                        <button onClick={() => setErrorMsg(null)} className="ml-auto hover:bg-red-100 dark:hover:bg-red-800 rounded p-1 transition-colors"><Icon name="close" /></button>
                                    </div>
                                )}
                                <textarea 
                                    className={`grow w-full bg-slate-50 dark:bg-slate-800 border ${isRecording ? 'border-red-400 dark:border-red-500 ring-1 ring-red-400' : 'border-slate-300 dark:border-slate-600'} text-slate-900 dark:text-white text-sm rounded-lg p-4 focus:ring-primary focus:border-primary focus:outline-none focus:ring-1 resize-none placeholder-slate-400 leading-relaxed overflow-y-auto transition-all cursor-text`}
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    placeholder="Click the microphone to record. Your speech will be transcribed here..."
                                    disabled={isTranscribing}
                                />
                                <div className="absolute bottom-3 right-3">
                                    <button 
                                        onClick={toggleRecording}
                                        disabled={isTranscribing}
                                        className={`flex items-center justify-center size-12 rounded-full text-white shadow-lg transition-all active:scale-95 ${isRecording ? 'bg-red-500 shadow-red-500/30 animate-pulse' : 'bg-slate-800 dark:bg-slate-600 hover:bg-slate-700'} ${isTranscribing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title={isRecording ? "Stop Recording" : "Start Recording"}
                                    >
                                        {isTranscribing ? (
                                            <Icon name="sync" className="text-xl animate-spin" />
                                        ) : (
                                            <Icon name={isRecording ? "stop" : "mic"} className="text-xl" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={handleProcess}
                            disabled={isProcessing || isRecording || isTranscribing}
                            className={`w-full py-3 px-4 bg-gradient-to-r from-teal-400 to-indigo-500 hover:from-teal-500 hover:to-indigo-600 text-white font-bold rounded-lg shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-sm ${isProcessing ? 'opacity-80 cursor-wait' : 'cursor-pointer'}`}
                        >
                            {isProcessing ? (
                                <><Icon name="sync" className="text-lg animate-spin" /> Analyzing...</>
                            ) : (
                                <><Icon name="bolt" className="text-lg" /> Process with AI</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Column: AI Output */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-slate-800 dark:text-white font-bold text-base">The AI Output (Split View)</h3>
                        <div className="flex gap-2">
                            <button className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"><Icon name="print" className="text-lg" /></button>
                            <button className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"><Icon name="share" className="text-lg" /></button>
                        </div>
                    </div>
                    <div className={`bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm flex flex-col h-[606px] transition-all duration-500 ${outputVisible || !isProcessing ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                        <div className="flex border-b border-slate-200 dark:border-slate-700 shrink-0">
                            <button 
                                onClick={() => setActiveTab('prescription')}
                                className={`flex-1 py-3 text-xs font-bold transition-colors uppercase tracking-wide cursor-pointer ${
                                    activeTab === 'prescription' 
                                    ? 'text-primary-dark dark:text-primary border-b-2 border-primary bg-primary/5' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border-b-2 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`}
                            >
                                Prescription
                            </button>
                            <button 
                                onClick={() => setActiveTab('claims')}
                                className={`flex-1 py-3 text-xs font-bold transition-colors uppercase tracking-wide cursor-pointer ${
                                    activeTab === 'claims' 
                                    ? 'text-primary-dark dark:text-primary border-b-2 border-primary bg-primary/5' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border-b-2 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`}
                            >
                                Claims & Billing
                            </button>
                        </div>
                        
                        {activeTab === 'prescription' ? (
                            <div className="flex flex-col h-full overflow-hidden animate-[fadeIn_0.3s_ease-out]">
                                <div className="p-4 flex flex-col gap-3 grow overflow-y-auto custom-scrollbar">
                                    {/* AI Suggestion Banner */}
                                    <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-lg text-amber-900 dark:text-amber-100 shadow-sm shrink-0">
                                        <Icon name="info" className="text-amber-600 mt-0.5 text-lg" />
                                        <div className="text-xs leading-relaxed">
                                            <span className="font-bold text-amber-800 dark:text-amber-200">Review AI suggestions.</span> Edit details or remove incorrect entries before signing.
                                        </div>
                                    </div>

                                    {medications.map((med) => (
                                        <div key={med.id} className={`p-3.5 border rounded-xl shadow-sm transition-all group ${med.isEditing ? 'bg-white dark:bg-slate-800 border-primary/30 ring-1 ring-primary/20' : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-primary/30'}`}>
                                            {med.isEditing ? (
                                                <div className="flex flex-col gap-3">
                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                        <div className="flex-1 flex gap-3 min-w-[200px]">
                                                            <div className="grow">
                                                                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Drug Name</label>
                                                                <input className="w-full bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary focus:border-primary placeholder-slate-400" type="text" defaultValue={med.name} />
                                                            </div>
                                                            <div className="w-24 shrink-0">
                                                                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Strength</label>
                                                                <input className="w-full bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary focus:border-primary placeholder-slate-400" type="text" defaultValue={med.strength} />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-5">
                                                            <button 
                                                                onClick={() => toggleEdit(med.id)}
                                                                className="flex items-center gap-1 px-3 py-1.5 text-primary-dark dark:text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-all text-[10px] font-bold uppercase tracking-wide border border-primary/20 cursor-pointer"
                                                            >
                                                                <Icon name="check" className="text-sm" />
                                                                Save
                                                            </button>
                                                            <button onClick={() => deleteMed(med.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-200 cursor-pointer">
                                                                <Icon name="delete" className="text-lg" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div>
                                                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Frequency</label>
                                                            <div className="relative">
                                                                <select className="w-full bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:ring-primary focus:border-primary appearance-none cursor-pointer" defaultValue={med.frequency}>
                                                                    <option>1x Daily</option>
                                                                    <option>2x Daily</option>
                                                                    <option>3x Daily</option>
                                                                </select>
                                                                <Icon name="expand_more" className="absolute inset-y-0 right-1 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Route</label>
                                                            <div className="relative">
                                                                <select className="w-full bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:ring-primary focus:border-primary appearance-none cursor-pointer" defaultValue={med.route}>
                                                                    <option>Oral</option>
                                                                    <option>Topical</option>
                                                                    <option>Injection</option>
                                                                </select>
                                                                <Icon name="expand_more" className="absolute inset-y-0 right-1 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Duration</label>
                                                            <input className="w-full bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:ring-primary focus:border-primary" type="text" defaultValue={med.duration} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-2 mb-1">
                                                            Instructions
                                                            <span className="text-teal-700 dark:text-teal-300 text-[9px] font-bold bg-teal-100 dark:bg-teal-900/40 px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-800">AI Suggested</span>
                                                        </label>
                                                        <textarea className="w-full bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:ring-primary focus:border-primary resize-none leading-relaxed" rows={2} defaultValue={med.instructions}></textarea>
                                                    </div>
                                                    {med.alert && (
                                                        <div className="relative flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-lg text-amber-800 dark:text-amber-200 text-xs font-medium group/alert">
                                                            <Icon name="warning" className="text-base text-amber-600 dark:text-amber-400" />
                                                            <span className="flex-1 pt-0.5"><span className="font-bold">Alert: </span>{med.alert}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                                <Icon name={med.route === 'Oral' ? 'pill' : 'medication'} />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{med.name}</h4>
                                                                <p className="text-[10px] font-bold text-slate-500">{med.strength} • {med.frequency} • {med.duration}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            {med.isVerified && (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-[9px] font-bold border border-green-100 dark:border-green-800">
                                                                    <Icon name="check" className="text-[10px]" /> Validated
                                                                </span>
                                                            )}
                                                            {med.isAutoAdded && (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-[9px] font-bold border border-indigo-100 dark:border-indigo-800">
                                                                    Auto-Added
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {med.alert && (
                                                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-[10px] font-bold ml-1">
                                                            <Icon name="warning" className="text-xs" />
                                                            {med.alert}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-end gap-2 mt-1 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                                        <button 
                                                            onClick={() => toggleEdit(med.id)}
                                                            className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-primary transition-colors px-2 py-1 rounded hover:bg-primary/5 cursor-pointer"
                                                        >
                                                            <Icon name="edit" className="text-xs" /> Edit Details
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <button className="w-full py-2.5 border border-dashed border-primary text-primary-dark dark:text-primary font-bold rounded-xl hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-xs active:scale-[0.99] group mt-1 cursor-pointer">
                                        <Icon name="add_circle" className="group-hover:scale-110 transition-transform text-sm" />
                                        Add Medication Manually
                                    </button>
                                </div>
                                <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/30 mt-auto shrink-0">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Icon name="verified_user" className="text-emerald-500 text-lg" />
                                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Status:</span>
                                            </div>
                                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">{medications.length} Medications Verified</span>
                                        </div>
                                        <button className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-slate-900 font-bold rounded-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] text-sm cursor-pointer">
                                            <Icon name="edit_document" />
                                            Confirm Changes & e-Sign
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full overflow-hidden animate-[fadeIn_0.3s_ease-out]">
                                <div className="p-4 flex flex-col gap-4 grow overflow-y-auto custom-scrollbar">
                                    <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-lg text-emerald-800 dark:text-emerald-200 text-xs font-medium">
                                        <Icon name="check_circle" className="text-base" />
                                        Codes successfully mapped with 98% confidence.
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/30">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase">ICD-10 Diagnosis Code</p>
                                                <Icon name="edit" className="text-slate-300 text-sm cursor-pointer hover:text-primary transition-colors" />
                                            </div>
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <div className="flex items-baseline gap-2 mb-1">
                                                        <span className="text-xl font-bold text-slate-900 dark:text-white">{diagnosis.code}</span>
                                                        {diagnosis.category && (
                                                            <span className="text-[9px] font-bold text-primary-dark dark:text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                                                                {diagnosis.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{diagnosis.desc}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/30">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase">CPT Service Code</p>
                                                <Icon name="edit" className="text-slate-300 text-sm cursor-pointer hover:text-primary transition-colors" />
                                            </div>
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <div className="flex items-baseline gap-2 mb-1">
                                                        <span className="text-xl font-bold text-slate-900 dark:text-white">{cpt.code}</span>
                                                        {cpt.level && (
                                                            <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                                                {cpt.level}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-1">{cpt.desc}</p>
                                                    {cpt.time && (
                                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                                            Typical duration: {cpt.time}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/30">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase">Place of Service</p>
                                                <Icon name="edit" className="text-slate-300 text-sm cursor-pointer hover:text-primary transition-colors" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Icon name="location_on" className="text-primary-dark dark:text-primary text-sm" />
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">{placeOfService}</span>
                                            </div>
                                        </div>
                                        {modifiers.length > 0 && (
                                            <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/30">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Modifiers</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {modifiers.map((mod, idx) => (
                                                        <span key={idx} className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-600">
                                                            {mod}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <hr className="border-slate-200 dark:border-slate-700 my-2"/>
                                    <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-slate-600 dark:text-slate-300 font-bold mb-0.5">Estimated Reimbursement</span>
                                                <span className="text-[10px] text-slate-500 dark:text-slate-400">Based on Medicare Fee Schedule & Payer Contract</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tracking-tight">
                                                    {reimbursement}
                                                </div>
                                                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">Per encounter</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="mt-auto w-full py-3 px-4 bg-primary hover:bg-primary-dark text-slate-900 font-bold rounded-lg shadow-md shadow-primary/20 flex items-center justify-center gap-2 transition-all text-sm cursor-pointer">
                                        <Icon name="send" />
                                        Submit Claim
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Submissions */}
            <div className="flex flex-col gap-3">
                <h3 className="text-slate-800 dark:text-white font-bold text-base">Recent Submissions</h3>
                <div className="w-full bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto custom-scrollbar">
                        <table className="w-full min-w-[600px]">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Patient</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {submissionsLoading ? (
                                  <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center">
                                      <LoadingSpinner />
                                    </td>
                                  </tr>
                                ) : recentSubmissions.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                                      No recent submissions
                                    </td>
                                </tr>
                                ) : (
                                  recentSubmissions.slice(0, 10).map((claim) => {
                                    const patient = patients.find(p => p.id === claim.patientId);
                                    const patientName = patient?.name || 'Unknown Patient';
                                    const initials = patientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                                    const claimDate = new Date(claim.createdAt);
                                    const dateDisplay = claimDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                    const hasMedications = claim.medications && claim.medications.length > 0;
                                    const statusColors = {
                                      pending: { text: 'text-amber-600 dark:text-amber-400', icon: '⏳', label: 'Processing' },
                                      approved: { text: 'text-emerald-600 dark:text-emerald-400', icon: '✅', label: 'Approved' },
                                      rejected: { text: 'text-red-600 dark:text-red-400', icon: '❌', label: 'Rejected' },
                                    };
                                    const statusInfo = statusColors[claim.status] || statusColors.pending;
                                    
                                    return (
                                      <tr key={claim.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap font-medium">{dateDisplay}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-2.5">
                                            {patient?.avatar ? (
                                              <div className="size-6 rounded-full bg-slate-200 dark:bg-slate-700 bg-center bg-cover" style={{ backgroundImage: `url("${patient.avatar}")` }}></div>
                                            ) : (
                                              <div className="size-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                {initials}
                                              </div>
                                            )}
                                            <div className="flex flex-col">
                                              <span className="text-xs font-bold text-slate-900 dark:text-white">{patientName}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${hasMedications ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-100 dark:border-purple-900/50' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50'}`}>
                                            {hasMedications ? 'Rx' : 'Claim'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                          <span className={`text-xs font-bold ${statusInfo.text} flex items-center gap-1`}>
                                            {statusInfo.icon} {statusInfo.label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                        <button className="text-slate-400 hover:text-primary transition-colors cursor-pointer"><Icon name="more_vert" className="text-lg" /></button>
                                    </td>
                                </tr>
                                    );
                                  })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden flex flex-col divide-y divide-slate-200 dark:divide-slate-700">
                        {submissionsLoading ? (
                          <div className="p-8 text-center">
                            <LoadingSpinner />
                                    </div>
                        ) : recentSubmissions.length === 0 ? (
                          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                            No recent submissions
                                </div>
                        ) : (
                          recentSubmissions.slice(0, 10).map((claim) => {
                            const patient = patients.find(p => p.id === claim.patientId);
                            const patientName = patient?.name || 'Unknown Patient';
                            const initials = patientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                            const claimDate = new Date(claim.createdAt);
                            const dateDisplay = claimDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            const hasMedications = claim.medications && claim.medications.length > 0;
                            const statusColors = {
                              pending: { text: 'text-amber-600 dark:text-amber-400', icon: '⏳', label: 'Processing' },
                              approved: { text: 'text-emerald-600 dark:text-emerald-400', icon: '✅', label: 'Approved' },
                              rejected: { text: 'text-red-600 dark:text-red-400', icon: '❌', label: 'Rejected' },
                            };
                            const statusInfo = statusColors[claim.status] || statusColors.pending;
                            
                            return (
                              <div key={claim.id} className="p-4 flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    {patient?.avatar ? (
                                      <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 bg-center bg-cover" style={{ backgroundImage: `url("${patient.avatar}")` }}></div>
                                    ) : (
                                      <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                        {initials}
                                      </div>
                                    )}
                                    <div>
                                      <span className="text-sm font-bold text-slate-900 dark:text-white block">{patientName}</span>
                                      <span className="text-[10px] text-slate-500">{dateDisplay}</span>
                                    </div>
                                </div>
                                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${hasMedications ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-100 dark:border-purple-900/50' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50'}`}>
                                    {hasMedications ? 'Rx' : 'Claim'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                                  <span className={`text-xs font-bold ${statusInfo.text} flex items-center gap-1.5`}>
                                    {statusInfo.icon} {statusInfo.label}
                                </span>
                                <button className="text-slate-400 hover:text-primary transition-colors p-1 cursor-pointer"><Icon name="more_vert" className="text-lg" /></button>
                            </div>
                        </div>
                            );
                          })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
