// pages/index.js
import Head from "next/head";
import UploadAndStage from "../components/UploadAndStage";

export default function Home() {
  return (
    <>
      <Head>
        <title>IconicVirtual.AI – Demo Flow</title>
      </Head>
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px"
        }}
      >
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" }}>
          IconicVirtual.AI – Demo Flow
        </h1>
        <p
          style={{
            color: "#555",
            marginBottom: "24px",
            maxWidth: "480px",
            textAlign: "center"
          }}
        >
          Upload a room photo, send it to VirtualStagingAI, and pay to download
          your virtually staged image.
        </p>
        <UploadAndStage />
      </main>
    </>
  );
}
