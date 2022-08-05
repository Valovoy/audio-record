import { useState, useRef, useEffect, useCallback } from 'react'

const useAudioPlay = url => {
  const [isPlay, setPlay] = useState(false)
  const audioRef = useRef(null)

  const onToggleAudioPlay = useCallback(() => {
    isPlay ? audioRef.current.pause() : audioRef.current.play()
    setPlay(s => !s)
  }, [isPlay])

  const onStopAudioPlay = useCallback(() => {
    isPlay && audioRef.current.pause()
    setPlay(false)
  }, [isPlay])

  const endedPlay = useCallback(() => {
    audioRef?.current && setPlay(false)
  }, [])

  useEffect(() => {
    if (url) {
      audioRef.current = new Audio(url)

      audioRef.current?.addEventListener('ended', endedPlay)
    }

    return () => {
      audioRef?.current &&
        audioRef.current.removeEventListener('ended', endedPlay)
    }
  }, [url, endedPlay])

  return {
    isPlay,
    onToggleAudioPlay,
    onStopAudioPlay,
  }
}

export default useAudioPlay
