import { createContext, useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";

const SocketContext = createContext();
const socket = io("http://localhost:8080");
const ContextProvider = ({ children }) => {
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState();
  const [userStream, setUserStream] = useState();
  const [name, setName] = useState("Usman");
  const [call, setCall] = useState({});
  const [me, setMe] = useState("");
  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        console.log("current stream", currentStream);
        setStream(currentStream);
      });

    socket.on("me", (id) => setMe(id));
    socket.on("callUser", (data) => {
      console.log("signal.........", data);
      const { signal } = data;
      // const parsedSignal = JSON.parse(signal);
      const parsedSignal = signal;
      console.log("Received signal:", parsedSignal);
      // if (
      //   !parsedSignal ||
      //   parsedSignal.type !== "offer" ||
      //   !parsedSignal.sdp ||
      //   !parsedSignal.type !== "candidate" ||
      //   !parsedSignal.candidate
      // ) {
      //   console.error("Invalid parsedSignal format:", parsedSignal);
      //   return;
      // }
      // setUserStream(parsedSignal);
      setCall({
        isReceivingCall: true,
        signal: parsedSignal,
        from: data.from,
        name: data.name,
      });
    });
  }, []);

  useEffect(() => {
    if (stream) {
      myVideo.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    console.log("stream........", userStream);
    if (callAccepted && userStream) {
      console.log("setting value.......");
      userVideo.current.srcObject = userStream;
    }
  }, [callAccepted, userStream]);

  const answerCall = () => {
    console.log("answering call....");
    const peer = new Peer({
      initiator: false,
    });
    console.log("peer created");
    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: call.from });
    });

    peer.on("stream", (currentStream) => {
      console.log("stream received", currentStream);
      // setUserStream(currentStream);
      userVideo.current.srcObject = currentStream;
    });

    console.log("calling....", call);
    peer.signal(call.signal);
    console.log("peer signal.....", peer);
    connectionRef.current = peer;
    setCallAccepted(true);
  };

  const callUser = (id) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
        name,
      });
    });
    peer.on("stream", (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });
    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });
    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    connectionRef.current.destroy();
    window.location.reload();
  };
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return (
    <SocketContext.Provider
      value={{
        call,
        callAccepted,
        myVideo,
        userVideo,
        stream,
        name,
        setName,
        callEnded,
        me,
        callUser,
        leaveCall,
        answerCall,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
export { ContextProvider, SocketContext };
