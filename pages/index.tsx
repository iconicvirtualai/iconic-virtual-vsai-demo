// pages/index.tsx — redirect / to marketing homepage
import { GetServerSideProps } from "next";

export default function Home() {
  return null;
  }

  export const getServerSideProps: GetServerSideProps = async () => {
    return {
        redirect: {
              destination: "/home.html",
                    permanent: false,
                        },
                          };
                          };
                          
