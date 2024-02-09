import DashboardBar from "@/components/DashboardBar";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <DashboardBar />
            {children}
        </>
    );
};

export default DashboardLayout;
