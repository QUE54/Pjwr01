document.addEventListener("DOMContentLoaded", () => {
  const logBody = document.querySelector("#logTable tbody");
  const statusSummary = document.getElementById("statusSummary");
  const statusIcon = document.getElementById("statusIcon");
  const statusText = document.getElementById("statusText");

  const R4_IP = "http://10.147.64.147"; // IP ของ R4
  let prevFall = false;

  function addTableRow(data) {
    const tr = document.createElement("tr");

    if(data.status==="normal") tr.classList.add("normal");
    else if(data.status==="fall") tr.classList.add("fall");
    else if(data.status==="stand") tr.classList.add("stand");

    tr.innerHTML = `
      <td>${data.status==="normal"?"ปกติ":data.status==="fall"?"ล้ม!":"ลุก"}</td>
      <td>${data.force.toFixed(2)}</td>
      <td>${data.angle.toFixed(1)}</td>
      <td>${data.date}</td>
      <td>${data.time}</td>
    `;

    logBody.prepend(tr);
    tr.classList.add("highlight");
    setTimeout(()=>tr.classList.remove("highlight"),1000);
    logBody.parentElement.scrollTop = 0;

    // Update status summary
    if(data.status==="normal"){
      statusSummary.className = "status-summary normal";
      statusIcon.innerText = "💤";
      statusText.innerText = "ปกติ";
    } else if(data.status==="fall"){
      statusSummary.className = "status-summary fall";
      statusIcon.innerText = "⚠️";
      statusText.innerText = "ล้ม!";
      if(!prevFall && Notification.permission==="granted"){
        new Notification("ผู้สูงอายุล้ม!",{
          body:`แรง: ${data.force.toFixed(2)}G มุม: ${data.angle.toFixed(1)}°`
        });
      }
    } else if(data.status==="stand"){
      statusSummary.className = "status-summary stand";
      statusIcon.innerText = "✅";
      statusText.innerText = "ลุกแล้ว";
    }

    prevFall = (data.status==="fall");
  }

  async function fetchData() {
    try {
      const res = await fetch(R4_IP + "/data");
      if(!res.ok) throw new Error("HTTP error " + res.status);
      const data = await res.json();

      const now = new Date();
      const rowData = {
        status: data.fall ? "fall" : "normal",
        force: data.totalG,
        angle: Math.max(Math.abs(data.angleX), Math.abs(data.angleY)),
        date: now.toLocaleDateString("th-TH"),
        time: now.toLocaleTimeString("th-TH")
      };

      addTableRow(rowData);

      // ถ้าลุกหลังล้ม
      if(prevFall && !data.fall){
        const standData = {
          status: "stand",
          force: rowData.force,
          angle: rowData.angle,
          date: rowData.date,
          time: rowData.time
        };
        addTableRow(standData);
      }

    } catch(e){
      console.log("Error fetching data:", e);
    }
  }

  if(Notification.permission!=="granted") Notification.requestPermission();

 setInterval(fetchData, 1000);
});
