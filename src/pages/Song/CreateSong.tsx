import { useRef, useState } from "react";
import React from "react";

export default function CreateSong() {
  const [textSong, setSong] = useState("");
  const [textSinger, setSinger] = useState("");
  const [textUrl, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function onChangeSong(event) {
    setSong(event.target.value);
  }

  function onChangeSinger(event) {
    setSinger(event.target.value);
  }

  function onChangeUrl(event) {
    setUrl(event.target.value);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isLoading && songRef.current) {
      setIsLoading(true);

      const song = songRef.current.value;
      const singer = singerRef.current?.value;
      const url = urlRef.current?.value;

      if (!isLoading) {
        setIsLoading(true);
        fetch(`http://localhost:3001/songs/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            song,
            singer,
            url,
            tagIds: [],
            isPlaying: false,
            createdDate: new Date().getTime(),
            count: 0,
          }),
        }).then((res) => {
          if (res.ok) {
            alert("생성이 완료 되었습니다");
            setIsLoading(false);
          }
        });
      }

      setSong("");
      setSinger("");
      setUrl("");
    }
  }

  const songRef = useRef<HTMLInputElement>(null);
  const singerRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);

  return (
    <form onSubmit={onSubmit}>
      <div className="input_area">
        <label>Song</label>
        <input
          type="text"
          value={textSong}
          placeholder="song"
          ref={songRef}
          onChange={onChangeSong}
          required
        />
      </div>
      <div className="input_area">
        <label>Singer</label>
        <input
          type="text"
          value={textSinger}
          placeholder="singer"
          ref={singerRef}
          onChange={onChangeSinger}
        />
      </div>
      <div className="input_area">
        <label>Url</label>
        <input
          type="url"
          value={textUrl}
          placeholder="url"
          ref={urlRef}
          onChange={onChangeUrl}
        />
      </div>
      <button
        style={{
          opacity: isLoading ? 0.3 : 1,
        }}
      >
        {isLoading ? "Saving..." : "저장"}
      </button>
    </form>
  );
}
