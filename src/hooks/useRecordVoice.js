import { useEffect, useCallback, useReducer, useRef } from "react";

const reducer = (state, action) => {
  switch (action.type) {
    case "START_RECORD":
      return { ...state, isStartRecord: true };
    case "TOGGLE_PAUSE":
      return { ...state, isPauseRecord: !state.isPauseRecord };
    case "STOP_RECORD":
      return { ...state, isStartRecord: false };
    default:
      throw new Error();
  }
};

const MIN_HEIGHT_2PX = 2;
const DEFAULT_CLASS_NAME = "candle";
const DEFAULT_CANDLE_COUNT = 25;

const useRecordVoice = ({
  saveRecord,
  equalizerContainer,
  candleClassName = DEFAULT_CLASS_NAME,
  candleCount = DEFAULT_CANDLE_COUNT,
  isEqualizer = true,
  coefficientHeight = null,
}) => {
  const [state, dispatch] = useReducer(reducer, {
    isStartRecord: false,
    isPauseRecord: false,
  });

  const mediaStreamRef = useRef();
  const mediaRecorderRef = useRef();
  const elementsArrayRef = useRef(null);
  const uint8Array = useRef(null);
  const requestRef = useRef(null);
  const animationRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextSrcRef = useRef(null);

  const createEqualizer = useCallback(() => {
    const container = document.getElementById(equalizerContainer);

    if (container.hasChildNodes()) return;

    for (let i = 0; i < candleCount; i++) {
      let candle = document.createElement("div");
      candle.className = candleClassName;
      candle.style.minHeight = MIN_HEIGHT_2PX + "px";
      container.appendChild(candle);
    }

    elementsArrayRef.current = document.getElementsByClassName(candleClassName);
  }, [equalizerContainer, candleCount, candleClassName]);

  const loopAnalyser = useCallback(() => {
    if (animationRef.current === false) {
      cancelAnimationFrame(requestRef.current);

      return;
    }

    requestRef.current = requestAnimationFrame(loopAnalyser);
    analyserRef.current.getByteFrequencyData(uint8Array.current);

    for (let i = 0; i < candleCount; i++) {
      const height = uint8Array.current[i + candleCount];
      const minHeight = height >= MIN_HEIGHT_2PX ? height : MIN_HEIGHT_2PX;

      elementsArrayRef.current[i].style.minHeight =
        (!!coefficientHeight ? minHeight / coefficientHeight : minHeight) +
        "px";
    }
  }, [candleCount, coefficientHeight]);

  const startEqualizer = useCallback(() => {
    if (!isEqualizer) return;

    if (!!audioContextSrcRef.current) {
      audioContextSrcRef.current.connect(analyserRef.current);
      animationRef.current = true;
      loopAnalyser();
    }
  }, [loopAnalyser, isEqualizer]);

  const createAudioContext = useCallback(() => {
    if (!isEqualizer) return;

    const audioContext = new AudioContext();
    analyserRef.current = audioContext.createAnalyser();

    audioContextSrcRef.current = !!mediaStreamRef.current
      ? audioContext.createMediaStreamSource(mediaStreamRef.current)
      : null;

    startEqualizer();
  }, [isEqualizer, startEqualizer]);

  const stopEqualizer = useCallback(() => {
    if (!isEqualizer) return;

    if (!!audioContextSrcRef.current && !state.isPauseRecord) {
      audioContextSrcRef.current.disconnect();
    }
  }, [state.isPauseRecord, isEqualizer]);

  const enableRecord = useCallback(() => {
    mediaRecorderRef.current.start();
    !!audioContextSrcRef.current ? startEqualizer() : createAudioContext();
    dispatch({ type: "START_RECORD" });
  }, [startEqualizer, createAudioContext]);

  const createMediaRecorder = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mediaRecorder = Object.assign(new MediaRecorder(mediaStream), {
        ondataavailable: (audioChunk) => saveRecord(audioChunk?.data),
      });

      mediaStreamRef.current = mediaStream;
      mediaRecorderRef.current = mediaRecorder;

      enableRecord();
    } catch (err) {
      // Removed for brevity
      console.error(err);
    }
  }, [enableRecord, saveRecord]);

  const startRecord = useCallback(() => {
    if (!mediaStreamRef.current) {
      createMediaRecorder();
    } else {
      enableRecord();
    }
  }, [createMediaRecorder, enableRecord]);

  const stopRecord = useCallback(() => {
    mediaRecorderRef.current.stop();
    stopEqualizer();
    dispatch({ type: "STOP_RECORD" });
  }, [stopEqualizer]);

  const resumeRecord = useCallback(() => {
    mediaRecorderRef.current.resume();
    startEqualizer();
  }, [startEqualizer]);

  const pauseRecord = useCallback(() => {
    mediaRecorderRef.current.pause();
    stopEqualizer();
  }, [stopEqualizer]);

  const togglePauseRecord = useCallback(() => {
    state.isPauseRecord ? resumeRecord() : pauseRecord();
    dispatch({ type: "TOGGLE_PAUSE" });
  }, [state.isPauseRecord, pauseRecord, resumeRecord]);

  useEffect(() => {
    if (isEqualizer) {
      createEqualizer();
    }
  }, [createEqualizer, isEqualizer]);

  useEffect(() => {
    if (isEqualizer) {
      uint8Array.current = new Uint8Array(candleCount * 2);
    }
  }, [candleCount, isEqualizer]);

  useEffect(() => {
    return () => {
      !!mediaStreamRef.current &&
        mediaStreamRef.current?.getTracks().forEach((track) => {
          track.stop();
        });
    };
  }, []);

  useEffect(() => {
    return () => {
      animationRef.current = false;
    };
  }, []);

  return {
    startRecord,
    stopRecord,
    togglePauseRecord,
    isStartRecord: state.isStartRecord,
    isPauseRecord: state.isPauseRecord,
  };
};

export default useRecordVoice;
