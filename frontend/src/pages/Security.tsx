import HomeLayout from "../components/layout/HomeLayout";
import MainSecurity from "../components/security/MainSecurity";

export default function Security() {
  return (
    <HomeLayout headerName="Security" sub="- Camera & Motion">
      <MainSecurity />
    </HomeLayout>
  );
}
