import { useState, useCallback, useEffect } from "react";
import cn from "classnames";
import useRecordVoice from "./hooks/useRecordVoice";
import useAudioPlay from "./hooks/useAudioPlay";
import CircleButton from "./CircleButton/CircleButton";
import {
  Check,
  X,
  Microphone,
  Repeat,
  Pause,
  VolumeUp,
  StopRecord,
} from "./svg";
import styles from "./RecordVoice.module.css";

const EQUALIZER_CONTAINER = "equalizer";

const App = () => {
  console.log(55555);
  const [isListenRecord, setListenRecord] = useState(false);
  const [isSendRecord, setSendRecord] = useState(false);
  const [urlForRepeat, setUrlForRepeat] = useState("");
  const [recordBlob, setRecordBlob] = useState(null);

  const { isPlay, onToggleAudioPlay, onStopAudioPlay } =
    useAudioPlay(urlForRepeat);


  const resetState = useCallback(() => {
    setUrlForRepeat("");
    setRecordBlob(null);
    setListenRecord(false);
    setSendRecord(false);
    onStopAudioPlay();
  }, [onStopAudioPlay]);

  const sendVoiceAnswer = useCallback(
    (file) => {
      const formData = new FormData();
      formData.append("audioFile", file);

      console.log("Sent audio", formData);

      resetState();
    },
    [resetState]
  );

  const saveRecord = useCallback((file) => {
    setRecordBlob(file);
  }, []);

  const { isStartRecord, startRecord, stopRecord } = useRecordVoice({
    saveRecord,
    equalizerContainer: EQUALIZER_CONTAINER,
  });

  const onToggleAudioRecord = () => {
    isStartRecord ? onStopRecord() : startRecord();
  };

  const onSendRecord = () => {
    setSendRecord(true);
    isStartRecord && stopRecord();
  };

  const onStopRecord = () => {
    setListenRecord(true);
    stopRecord();
  };

  const onCancelAudioRecord = () => {
    isStartRecord && stopRecord();
    isListenRecord && resetState();
  };

  const onRedoAudioRecord = () => {
    isStartRecord && stopRecord();
    isListenRecord && resetState();
    startRecord();
  };

  useEffect(() => {
    if (!!recordBlob) {
      if (isSendRecord) {
        sendVoiceAnswer(recordBlob);

        return;
      }

      if (isListenRecord) {
        const audioUrl = URL.createObjectURL(recordBlob);
        setUrlForRepeat(audioUrl);

        return;
      }
    }
  }, [recordBlob, isListenRecord, isSendRecord, sendVoiceAnswer]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.playerContainer}>
          <div id={EQUALIZER_CONTAINER} className={styles.equalizer} />
          <div className={styles.controls}>
            {(isStartRecord || isListenRecord) && (
              <CircleButton
                Icon={X}
                iconClassName={styles.deleteRecord}
                onClickAction={onCancelAudioRecord}
              />
            )}
            {!isListenRecord ? (
              <CircleButton
                Icon={isStartRecord ? StopRecord : Microphone}
                btnClassName={styles.recordBtn}
                iconClassName={styles.recordSvg}
                isPrimary
                onClickAction={onToggleAudioRecord}
              />
            ) : (
              <CircleButton
                Icon={isPlay ? Pause : VolumeUp}
                btnClassName={styles.recordBtn}
                iconClassName={styles.recordSvg}
                isPrimary
                onClickAction={onToggleAudioPlay}
              />
            )}
            {(isStartRecord || isListenRecord) && (
              <CircleButton
                Icon={Check}
                iconClassName={styles.approveRecord}
                onClickAction={onSendRecord}
              />
            )}
          </div>
        </div>
      </div>

      {(isStartRecord || isListenRecord) && (
        <div>
          <div className={cn("p2", styles.redoContainer)}>
            <CircleButton
              Icon={Repeat}
              btnClassName={styles.redoBtn}
              iconClassName={styles.redoSvg}
              onClickAction={onRedoAudioRecord}
            />
            Redo recording
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
