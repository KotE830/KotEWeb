import { useRef, useState } from "react";
import React from "react";

export default function CreateTag() {
  const [textTag, setTextTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function onChangeTag(event) {
    setTextTag(event.target.value);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isLoading && tagRef.current) {
      setIsLoading(true);

      const tag = tagRef.current.value;

      if (!isLoading) {
        setIsLoading(true);
        fetch(`http://localhost:3001/tags/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tag: tag,
            songIds: [],
            count: 0
          }),
        }).then((res) => {
          if (res.ok) {
            alert("생성이 완료 되었습니다");
            setIsLoading(false);
          }
        });

        setTextTag("");
      }
    }
  }

  const tagRef = useRef<HTMLInputElement>(null);

  return (
    <form onSubmit={onSubmit}>
      <div className="input_area">
        <label>Tag</label>
        <input
          type="text"
          value={textTag}
          placeholder="computer"
          ref={tagRef}
          onChange={onChangeTag}
          required
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
