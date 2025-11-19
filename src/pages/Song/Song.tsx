import React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import "../CSS/Song.css";
import axios from "axios";

interface IProps {
  song: ISong;
}

export interface ISong {
  id: number;
  song: string;
  singer: string;
  url: string;
  tagIds: number[];
  isPlaying: boolean;
  createdDate: Date;
  count: number;
}

export default function Song({ song: s }: IProps) {
  const [song, setSong] = useState(s);
  const [isPlaying, setIsPlaying] = useState(s.isPlaying);
  const [count, setCount] = useState(s.count);

  const thumbnail =
    "https://img.youtube.com/vi/" +
    song.url.split(/=|&/)[1] +
    "/maxresdefault.jpg";

  function addQueue() {
    let newCount = count;
    if (!isPlaying) {
      newCount++;

      const params = new URLSearchParams();
      params.append("song", song.url ? song.url : song.song);
      axios
        .post(`http://localhost:8080/songs/addqueue`, null, {
          params: params,
        })
        .then((res) => alert(res))
        .catch((error) => console.log(error));
    }

    fetch(`http://localhost:3001/songs/${song.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...song,
        isPlaying: !isPlaying,
        count: newCount,
      }),
    }).then((res) => {
      if (res.ok) {
        setIsPlaying(!isPlaying);
        setCount(newCount);
      }
    });
  }

  function del() {
    if (window.confirm("삭제 하시겠습니까?")) {
      fetch(`http://localhost:3001/songs/${song.id}`, {
        method: "DELETE",
      }).then((res) => {
        if (res.ok) {
          setSong({
            ...song,
            id: 0,
          });
        }
      });
    }
  }

  if (song.id === 0) {
    return null;
  }

  return (
    <div>
      <li key={song.id} className={isPlaying ? "play" : ""}>
        <div onClick={addQueue}>
          <h3>{song.song}</h3>
          <p>{song.singer}</p>
          <img src={thumbnail} className="thumbnail" />
        </div>
        <Link to={song.url} className="link">
          link
        </Link>
        <Link
          to={`/song/edit/${song.song}`}
          state={{ song: song }}
          className="btn"
        >
          Edit
        </Link>
        <button onClick={del} className="btn">
          Delete
        </button>
      </li>
    </div>
  );
}
