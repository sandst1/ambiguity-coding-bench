import { useEffect, useState } from "react";

export function CustomWidget() {
  const [data, setData] = useState("Loading...");

  useEffect(() => {
    setData("This is a custom widget added by the product team!");
    const id = setInterval(() => {
      setData(`Last updated: ${new Date().toLocaleTimeString()}`);
    }, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <div className="widget-header">
        <span className="widget-title">Custom Widget</span>
        <span className="widget-subtitle">Example</span>
      </div>
      <div className="widget-body">
        <p style={{ textAlign: "center", marginBottom: 0, fontSize: "14px" }}>
          {data}
        </p>
      </div>
    </>
  );
}