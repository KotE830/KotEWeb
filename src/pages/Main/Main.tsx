import React, { useEffect, useState } from "react";
import Queue from "./Queue.tsx";
import axios from "axios";

export default function Main() {
  const [queue, setQueue] = useState([]);
  const [isBotRunning, setIsBotRunning] = useState("waiting...");

  useEffect(() => {
    async function fetchData() {
      const resultQueue = await axios.get("/queue");
      const resultBot = await axios.get("/isboton");
      setQueue(resultQueue.data);
      setIsBotRunning(resultBot.data);
    }

    fetchData();
  }, []);

  console.log(queue);

  async function botOnOff() {
    let result;
    if (isBotRunning === "Off") {
      result = await axios.get("/botOn");
    } else {
      result = await axios.get("/botOff");
    }
    setIsBotRunning(result.data); 
  }
  // async function getQueue() {
  //   try {
  //     await axios.get("/queue").then((res) => {
  //       console.log(res);
  //       return res.data;
  //     });
  //   } catch (e) {
  //     console.log(e);
  //   }
  //   // await axios
  //   //   .get("/queue")
  //   //   .then((res) => {
  //   //     console.log(res);
  //   //     return res.data;
  //   //   })
  //   //   .catch((e) => {
  //   //     alert("error");
  //   //   });
  // }
  // const queue = getQueue();
  // console.log(queue);

  return (
    <>
      <h1>Main</h1>
      <button onClick={botOnOff}>Bot {isBotRunning}</button>
      <button className="btn">Join the channel</button>
      <div>
        Queue List
        <ul className="queue">
          {/* {queue.map((track) => (
              <Queue track={track} />
            ))} */}
          <Queue track={queue} />
        </ul>
      </div>
    </>
  );
}
