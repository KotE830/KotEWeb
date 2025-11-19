import React from "react";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <div className="header">
      <h1>
        <Link to="/">KotE</Link>
      </h1>
      <div className="menu">
        <Link to="/song" className="link">
          Song
        </Link>
        <Link to="/tag" className="link">
          Tag
        </Link>
        <Link to="/song/create" className="link">
          Add Song
        </Link>
        <Link to="/tag/create" className="link">
          Add Tag
        </Link>
      </div>
    </div>
  );
}
