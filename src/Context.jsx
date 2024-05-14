import { createContext, useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";

const SocketContext = createContext();
// const socketCon = io("https://crossplatform.paklogics.com/");
const ContextProvider = ({ children }) => {
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState();
  const [userStream, setUserStream] = useState();
  const [name, setName] = useState("Usman");
  const [call, setCall] = useState({});
  const [me, setMe] = useState(Math.floor(100000 + Math.random() * 900000).toString());
  const myVideo = useRef();
  const userVideo = useRef();
  const [candidateData, setCandidateData] = useState();
  const connectionRef = useRef();
  const [socket, setSocket] = useState(null);
  useEffect(() => {
    const socketCon = io("https://crossplatform.paklogics.com/", {
      query: {
        callerId: me
      }
    });

  
    socketCon.on("connect", () => {
      // console.log("Connection established");
    });
  
    // Optionally, handle disconnect or other events as needed
    socketCon.on("disconnect", () => {
      // console.log("Disconnected from server");
    });
  
    // Set the socket state
    setSocket(socketCon);
  
    // Clean up function
    return () => {
      socketCon.disconnect(); // Disconnect socket when component unmounts
    };
  }, [me]);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        // console.log("current stream", currentStream);
        setStream(currentStream);
      });

    // socket?.on("me", (id) => setMe(id));
    socket?.on("newCall", (data) => {
      // console.log("signal.........", data);
      const { rtcMessage } = data;
      // const parsedSignal = JSON.parse(signal);
      const parsedSignal = rtcMessage;
      // console.log("Received signal:", parsedSignal);
      setCall({
        isReceivingCall: true,
        signal: parsedSignal,
        from: data.callerId,
        name: "",
      });
    });

    socket?.on("ICEcandidate", (data) => {
      console.log("ice candidate.....", data)
      setCandidateData(data.candidate)
    })
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

  // const answerCall = () => {
  //   console.log("answering call....");
  //   const peer = new Peer({
  //     initiator: false,
  //     stream:stream,
  //   });
  //   console.log("peer created");
  //   peer.on("signal", (data) => {
  //     socket.emit("answerCall", { signal: data, to: call.from });
  //   });

  //   peer.on("stream", (currentStream) => {
  //     console.log("stream received", currentStream);
  //     setUserStream(currentStream);
  //     // userVideo.current.srcObject = currentStream;
  //   });

  //   console.log("calling....", call);
  //   peer.signal(call.signal);
  //   console.log("peer signal.....", peer);
  //   connectionRef.current = peer;
  //   setCallAccepted(true);
  // };

  // const callUser = (id) => {
  //   const peer = new Peer({ initiator: true, trickle: false, stream });
  //   peer.on("signal", (data) => {
  //     socket.emit("callUser", {
  //       userToCall: id,
  //       signalData: data,
  //       from: me,
  //       name,
  //     });
  //   });
  //   peer.on("stream", (currentStream) => {
  //     // userVideo.current.srcObject = currentStream;
  //     console.log("reciever stream.....", currentStream);
  //     setUserStream(currentStream)
  //   });
  //   socket?.on("callAccepted", (signal) => {
  //     console.log("call Accepted........", signal)

  //     if(signal.type === "candidate") {
  //       // Add ICE candidate to the peer connection
  //       peer._pc.addIceCandidate(signal.candidate);
  //     }
  //     else {
  //       peer.signal(signal);
  //     }
  //     // setUserStream(signal)
  //     setCallAccepted(true);
  //     // peer.signal(signal);
  //   });

  //   console.log("peer...........", peer)
  //   connectionRef.current = peer;
  // };

  const callUser = (id) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });
  
    peer.on("signal", (data) => {
      socket.emit("call", { calleeId: id, rtcMessage: data, user: me, name });
    });
  
    peer.on("stream", (currentStream) => {
      setUserStream(currentStream);
    });
  
    socket?.on("callAnswered", (signal) => {
      if (signal.type === "candidate") {
        // Handle ICE candidates
        // peer.addIceCandidate(signal.candidate);
        peer._pc.addIceCandidate(signal.rtcMessage);
      } else {
        console.log("dddddddddddd", signal)
        // Handle signaling data
        peer.signal(signal?.rtcMessage);
      }
      
      setCallAccepted(true);
    });

    socket?.on("ICEcandidate", (data) => {
      console.log("icecandidate.......", data)
      setCandidateData(data.rtcMessage?.candidate)
    })
  
    connectionRef.current = peer;
  };
  
  const answerCall = () => {
    const peer = new Peer({ initiator: false, trickle:false, stream, wrtc: {
      RTCPeerConnection,
      RTCSessionDescription,
      RTCIceCandidate,
      MediaStream,
      MediaStreamTrack
    } });
  
    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: call.from });
    });
  
    peer.on("stream", (currentStream) => {
      setUserStream(currentStream);
    });
  
    socket?.on("callAccepted", (signal) => {

      // console.log("Call accepted signal.........", signal)
      if (signal.type === "candidate") {
        // Handle ICE candidates
        // peer.addIceCandidate(signal.candidate);
        peer._pc.addIceCandidate(signal.candidate);
      } else {

        // if(candidateData) {
        //   peer._pc.addIceCandidate(candidateData);
        // }
        // Handle signaling data
        peer.signal(signal);
      }
  
    });


    socket?.on("ICEcandidate", (data) => {
      // console.log("icecandidate.......", data)
      setCandidateData(data.rtcMessage?.candidate)
    })
  
    peer.signal(call.signal);
    connectionRef.current = peer;
    setCallAccepted(true);
  };
  

  const leaveCall = () => {
    setCallEnded(true);
    // connectionRef.current.destroy();
    if (connectionRef.current) {
      connectionRef.current.destroy();
    }
    window.location.reload();
  };
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    console.log('canidate information.......', candidateData)
    if(connectionRef?.current && candidateData) {
      connectionRef.current._pc.addIceCandidate({candidate:candidateData, sdpMLineIndex: 0,
        sdpMid: "0"})
    }
  }, [connectionRef, candidateData])

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
