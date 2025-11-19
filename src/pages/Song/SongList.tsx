import useFetch from "../../hooks/useFetch.ts";
import React from "react";
import Song, { ISong } from "./Song.tsx";

export default function SongList() {
  const songs: ISong[] = useFetch("http://localhost:3001/songs");

  if (songs.length === 0) {
    return <span>Loading..</span>;
  }

  function onSubmit(e: React.FormEvent) {
    // e.preventDefault();

    // if (!isLoading && tagRef.current) {
    //   setIsLoading(true);

    //   const tag = tagRef.current.value;

    //   if (!isLoading) {
    //     setIsLoading(true);
    //     fetch(`http://localhost:3001/tags/`, {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //       body: JSON.stringify({
    //         tag,
    //         songIds: [],
    //       }),
    //     }).then((res) => {
    //       if (res.ok) {
    //         alert("생성이 완료 되었습니다");
    //         setIsLoading(false);
    //       }
    //     });

    //     setTextTag("");
    //   }
    // }
  }

  return (
    <>
      <h1>Songs</h1>
      <form onSubmit={onSubmit} className="search">
        <div className="input_area">
          <input type="text" placeholder="search" />
        </div>
        <button>Search</button>
      </form>
      <ul className="list_song">
        {songs.map((song) => (
          <Song song={song} key={song.id} />
        ))}
      </ul>
    </>
  );
}
