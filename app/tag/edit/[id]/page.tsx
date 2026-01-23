'use client';

import { useRef, useState, useEffect } from "react";
import React from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import useRequireAuth from "@/hooks/useRequireAuth";

export default function EditTag() {
  const params = useParams();
  const router = useRouter();
  const { loading: authLoading, isAuthenticated } = useRequireAuth();
  const [tag, setTag] = useState<any>(null);
  const [textTag, setTextTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const tagRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;

    const fetchTag = async () => {
      try {
        const response = await axios.get("/api/tags");
        const tags = response.data;
        const foundTag = tags.find((t: any) => t.id === params.id || t.name === params.id);
        if (foundTag) {
          setTag(foundTag);
          setTextTag(foundTag.name);
        }
      } catch (error) {
        console.error("Error fetching tag:", error);
      }
    };
    fetchTag();
  }, [params.id, isAuthenticated, authLoading]);

  if (authLoading || !isAuthenticated) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <span>Loading...</span>
      </div>
    );
  }

  if (!tag) {
    return <div>Loading...</div>;
  }

  function onChangeTag(event: React.ChangeEvent<HTMLInputElement>) {
    setTextTag(event.target.value);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isLoading && tagRef.current) {
      setIsLoading(true);

      const tagName = tagRef.current.value;

      const apiUrl = `/api/tags/${tag.id}`;

      fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: tagName,
        }),
      }).then(async (res) => {
        if (res.ok) {
          alert("Update completed.");
          router.push("/tag");
          setIsLoading(false);
        } else {
          const errorData = await res.json().catch(() => ({}));
          alert(`Failed to update: ${errorData.error || res.statusText}`);
          setIsLoading(false);
        }
      }).catch((error) => {
        console.error("Error updating tag:", error);
        alert(`Failed to update: ${error.message}`);
        setIsLoading(false);
      });
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="input_area">
        <label>Tag</label>
        <input
          type="text"
          value={textTag}
          ref={tagRef}
          onChange={onChangeTag}
          required
        />
      </div>
      <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
        <button
          type="button"
          onClick={() => router.push("/tag")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(108, 117, 125, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(108, 117, 125, 0.3)";
          }}
          style={{
            background: "linear-gradient(135deg, #6c757d 0%, #5a6268 100%)",
            boxShadow: "0 4px 12px rgba(108, 117, 125, 0.3)",
            transition: "all 0.3s ease",
          }}
        >
          Back
        </button>
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
      </div>
    </form>
  );
}
