// Tiện ích dùng chung cho các trang

async function apiPost(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

async function apiGet(url) {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

function showToast(message, isError) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.toggle("error", !!isError);
  toast.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove("show"), 3200);
}

function phaseTag(phase) {
  const map = {
    lobby: { text: "Phòng chờ", cls: "tag-lobby" },
    election: { text: "Bầu Trưởng Làng", cls: "tag-day" },
    transition: { text: "Đang chuyển cảnh", cls: "tag-night" },
    night: { text: "Ban đêm", cls: "tag-night" },
    day: { text: "Ban ngày", cls: "tag-day" },
    ended: { text: "Kết thúc", cls: "tag-ended" },
  };
  const info = map[phase] || map.lobby;
  return `<span class="tag ${info.cls}">${info.text}</span>`;
}

function getSession() {
  return {
    room: localStorage.getItem("mawoi_room") || "",
    name: localStorage.getItem("mawoi_name") || "",
  };
}

function setSession(room, name) {
  localStorage.setItem("mawoi_room", room);
  localStorage.setItem("mawoi_name", name);
}

const ROLE_INFO = {
  "Ma Sói": { side: "Phe Sói", desc: "Mỗi đêm, cùng bầy chọn một người để tiêu diệt. Ban ngày phải giả làm dân, tránh bị treo cổ." },
  "Tiên Tri": { side: "Phe Dân", desc: "Mỗi đêm được soi một người để biết họ có phải Ma Sói hay không." },
  "Bảo Vệ": { side: "Phe Dân", desc: "Mỗi đêm che chở một người, giúp họ miễn nhiễm với vết cắn của Sói đêm đó." },
  "Phù Thủy": { side: "Phe Dân", desc: "Có một bình cứu và một bình độc, mỗi bình chỉ dùng được một lần trong cả ván." },
  "Thợ Săn": { side: "Phe Dân", desc: "Nếu bị loại, có thể bắn theo một người khác. (Web sẽ hướng dẫn khi bạn bị loại)" },
  "Thần Tình Yêu": { side: "Phe Dân", desc: "Đêm đầu tiên chọn hai người thành đôi uyên ương gắn kết số phận." },
  "Trưởng Làng": { side: "Phe Dân", desc: "Vai đặc biệt cho bàn lớn. Lưu ý: chức Trưởng Làng thật trong ván này do cả làng tự bầu ở đầu ván, không nhất thiết là vai bài này." },
  "Thổi Sáo": { side: "Phe thứ ba", desc: "Mỗi đêm thôi miên hai người. Thắng khi tất cả người còn sống đều bị thôi miên." },
  "Ăn Trộm": { side: "Phe thứ ba", desc: "Đêm đầu tiên được đổi sang một trong hai vai dự phòng." },
  "Phản Bội": { side: "Phe thứ ba", desc: "Ban đầu là dân nhưng nếu bị Sói cắn mà không chết, sẽ ngả theo phe Sói." },
  "Dân Làng": { side: "Phe Dân", desc: "Không có khả năng đặc biệt. Dùng lý lẽ và quan sát để tìm ra Sói vào ban ngày." },
};

function roleInfo(role) {
  return ROLE_INFO[role] || { side: "", desc: "Hãy chờ hướng dẫn tiếp theo." };
}

const NIGHT_STEPS = [
  { key: "guard", label: "Bảo Vệ" },
  { key: "wolf", label: "Ma Sói" },
  { key: "seer", label: "Tiên Tri" },
  { key: "witch", label: "Phù Thủy" },
];

function initials(name) {
  const parts = name.trim().split(/\s+/);
  const last = parts[parts.length - 1] || name;
  return last.slice(0, 2).toUpperCase();
}

function avatarColor(name) {
  const colors = ["#e2ab52", "#6fb389", "#93a2d9", "#d4564d", "#c9a3e0", "#5fb8c9"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return colors[hash % colors.length];
}
