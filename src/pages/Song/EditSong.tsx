import { useRef, useState } from "react";
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function EditSong() {
  const location = useLocation();
  const s = location.state.song;

  const navigate = useNavigate();
  const [textSong, setTextSong] = useState(s.song);
  const [textSinger, setTextSinger] = useState(s.singer);
  const [textUrl, setTextUrl] = useState(s.url);
  const [tagIdsList, setTagIdsList] = useState(s.tagIds);
  const [isLoading, setIsLoading] = useState(false);
  const [count, setCount] = useState(s.count);

  function onChangeSong(event) {
    setTextSong(event.target.value);
  }

  function onChangeSinger(event) {
    setTextSinger(event.target.value);
  }

  function onChangeUrl(event) {
    setTextUrl(event.target.value);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isLoading && songRef.current) {
      setIsLoading(true);

      const song = songRef.current.value;
      const singer = singerRef.current?.value;
      const url = urlRef.current?.value;
      const tagIds = tagIdsRef.current?.value;

      if (!isLoading) {
        setIsLoading(true);
        fetch(`http://localhost:3001/songs/${s.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...s,
            song: song,
            singer: singer,
            url: url,
            tagIds: tagIds,
          }),
        }).then((res) => {
          if (res.ok) {
            alert("수정이 완료 되었습니다");
            navigate("/song");
            setIsLoading(false);
          }
        });
      }
    }
  }

  function resetCount() {
    fetch(`http://localhost:3001/songs/${s.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...s,
        count: 0,
      }),
    }).then((res) => {
      if (res.ok) {
        setCount(0);
      }
    });
  }

  const songRef = useRef<HTMLInputElement>(null);
  const singerRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const tagIdsRef = useRef<HTMLInputElement>(null);

  return (
    <form onSubmit={onSubmit}>
      <div className="input_area">
        <label>Song</label>
        <input
          type="text"
          value={textSong}
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
          ref={singerRef}
          onChange={onChangeSinger}
        />
      </div>
      <div className="input_area">
        <label>Url</label>
        <input type="url" value={textUrl} ref={urlRef} onChange={onChangeUrl} />
      </div>
      <div>
        <label>Tags</label>
      </div>
      <button
        style={{
          opacity: isLoading ? 0.3 : 1,
        }}
      >
        {isLoading ? "Saving..." : "저장"}
      </button>
      <button onClick={resetCount} className="btn">
        Reset Count
      </button>
    </form>
  );
}
