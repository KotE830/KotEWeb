import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import React from "react";

export default function EditTag() {
  const [isLoading, setIsLoading] = useState(false);

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
          }),
        }).then((res) => {
          if (res.ok) {
            alert("생성이 완료 되었습니다");
            setIsLoading(false);
          }
        });
      }
    }
  }

  const songRef = useRef<HTMLInputElement>(null);
  const singerRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);

  return (
    <form onSubmit={onSubmit}>
      <div className="input_area">
        <label>Song</label>
        <input type="text" placeholder="computer" ref={songRef} />
      </div>
      <div className="input_area">
        <label>Singer</label>
        <input type="text" placeholder="computer" ref={singerRef} />
      </div>
      <div className="input_area">
        <label>Url</label>
        <input type="url" placeholder="computer" ref={urlRef} />
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
