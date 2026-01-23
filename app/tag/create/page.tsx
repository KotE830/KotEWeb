'use client';

import { useRef, useState } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import useRequireAuth from "@/hooks/useRequireAuth";

export default function CreateTag() {
  const router = useRouter();
  const { loading: authLoading, isAuthenticated } = useRequireAuth();
  const [textTag, setTextTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function onChangeTag(event: React.ChangeEvent<HTMLInputElement>) {
    setTextTag(event.target.value);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isLoading && tagRef.current) {
      setIsLoading(true);

      const tag = tagRef.current.value;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/tags/`
        : "/api/tags/";

      fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: tag,  // server.ts expects 'name' field
        }),
      }).then(async (res) => {
        if (res.ok) {
          alert("Creation completed.");
          setIsLoading(false);
          router.push("/tag");
        } else {
          const errorData = await res.json().catch(() => ({}));
          alert(`Failed to create: ${errorData.error || res.statusText}`);
          setIsLoading(false);
        }
      }).catch((error) => {
        console.error("Error creating tag:", error);
        alert(`Failed to create: ${error.message}`);
        setIsLoading(false);
      });

      setTextTag("");
    }
  }

  const tagRef = useRef<HTMLInputElement>(null);

  // Show loading screen if loading or not authenticated
  if (authLoading || !isAuthenticated) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <span>Loading...</span>
      </div>
    );
  }

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
        disabled={isLoading}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(74, 158, 255, 0.4)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
        style={{
          transition: "all 0.3s ease",
        }}
      >
        {isLoading ? "Saving..." : "Save"}
      </button>
    </form>
  );
}

