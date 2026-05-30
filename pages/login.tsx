// pages/login.tsx — legacy login route
import { GetServerSideProps } from "next";

export default function LoginRedirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/staging-dashboard.html",
      permanent: false,
    },
  };
};
