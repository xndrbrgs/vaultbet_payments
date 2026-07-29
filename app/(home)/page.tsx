import Image from "next/image";

export default function Home() {
  return (
    <main className="h-[300vh]">
      <section className="grid grid-cols-12 gap-4 p-[clamp(16px,32px)]">
        <div className="col-span-6">
          <h1 className="text-[clamp(32px,98px)] leading-[0.8] uppercase font-monaSans font-semibold">
            Digital products built to launch 
          </h1>
        </div>
      </section>
    </main>
  );
}
