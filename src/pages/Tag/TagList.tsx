import useFetch from "../../hooks/useFetch.ts";
import React from "react";

export interface ITag {
  id: number;
  tag: string;
  songIds: number[];
  count: number;
}

export default function TagList() {
  const tags: ITag[] = useFetch("http://localhost:3001/tags");

  if (tags.length === 0) {
    return <span>Loading..</span>;
  }

  return (
    <div>
      <h1>Tags</h1>
      <ul className="list_tag">
        {tags.map((tag) => (
          <li key={tag.id}>
            <p>{tag.tag}</p>
            {/* <Link to={`/day/${day.day}`}>Day {day.day}</Link> */}
          </li>
        ))}
      </ul>
    </div>
  );
}
