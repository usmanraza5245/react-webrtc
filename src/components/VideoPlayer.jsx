import { Grid, Box, Heading } from "@chakra-ui/react";
import { SocketContext } from "../Context";
import { useContext } from "react";

const VideoPlayer = () => {
  const { name, callAccepted, myVideo, userVideo, callEnded, stream, call } =
    useContext(SocketContext);

  console.log("user video", userVideo);
  return (
    <Grid justifyContent="center" templateColumns="repeat(2, 1fr)" mt="12">
      {/* my video */}

      <Box>
        <Grid colSpan={1}>
          screen 1
          {stream && (
            <>
              <Heading as="h5">{name || "Name"}</Heading>
              <video playsInline muted ref={myVideo} autoPlay width="600" />
            </>
          )}
        </Grid>
      </Box>

      {/* user's video */}

      <Box>
        <Grid colSpan={1}>
          screen 2
          {callAccepted && (
            <>
              <Heading as="h5">{call.name || "Name"}</Heading>
              <video playsInline ref={userVideo} autoPlay width="600" />
            </>
          )}
        </Grid>
      </Box>
    </Grid>
  );
};
export default VideoPlayer;
