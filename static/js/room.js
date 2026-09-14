const session = getSession();
if (!session.room || !session.name) {
  window.location.href = "/";
}

document.getElementById("room-code-label").textContent = session.room;
document.getElementById("room-code-big").textContent = session.room;

let localSecondsLeft = null;
let countdownTimer = null;
let selectedSuspect = "";
let finalFetched = false;

function hideAll() {
  ["lobby-panel", "role-panel", "status-panel", "election-panel", "transition-panel", "night-panel", "day-panel", "end-panel", "roster-panel"]
    .forEach(id => document.getElementById(id).style.display = "none");
}

async function refresh() {
  const { ok, data } = await apiGet(`/api/my-role?room_code=${session.room}&name=${encodeURIComponent(session.name)}`);
  if (!ok || !data.success) {
    showToast(data.message || "Mất kết nối với phòng", true);
    return;
  }
  render(data);
}

function render(info) {
  const room = info.room;
  document.getElementById("phase-tag").innerHTML = phaseTag(room.phase);

  if (!room.is_started) {
    hideAll();
    document.getElementById("lobby-panel").style.display = "block";
    renderLobby(room);
    return;
  }

  document.getElementById("role-panel").style.display = "block";
  const ri = roleInfo(info.role);
  document.getElementById("role-side").textContent = (ri.side || "").toUpperCase();
  document.getElementById("role-name").textContent = info.role;
  document.getElementById("role-desc").textContent = ri.desc;

  document.getElementById("status-panel").style.display = "block";
  document.getElementById("alive-status").innerHTML = info.is_alive
    ? `<span class="dot dot-alive"></span> Bạn vẫn còn sống`
    : `<span class="dot dot-dead"></span> Bạn đã bị loại — tiếp tục theo dõi ván đấu trong im lặng`;

  document.getElementById("night-panel").style.display = "none";
  document.getElementById("day-panel").style.display = "none";
  document.getElementById("end-panel").style.display = "none";
  document.getElementById("election-panel").style.display = "none";
  document.getElementById("transition-panel").style.display = "none";

  if (room.phase === "ended") {
    document.getElementById("end-panel").style.display = "block";
    renderEnd(info, room);
  } else if (room.phase === "election") {
    document.getElementById("election-panel").style.display = "block";
    renderElection(info, room);
  } else if (room.phase === "transition") {
    document.getElementById("transition-panel").style.display = "block";
    renderTransition(info, room);
  } else if (room.phase === "night") {
    document.getElementById("night-panel").style.display = "block";
    renderNight(info, room);
  } else if (room.phase === "day") {
    document.getElementById("day-panel").style.display = "block";
    renderDay(info, room);
  }

  document.getElementById("roster-panel").style.display = "block";
  document.getElementById("roster-list").innerHTML = room.players.map(p => `
    <div class="player-row-v2 ${p.is_alive ? '' : 'dead'}">
      <span class="avatar" style="background:${avatarColor(p.name)}">${initials(p.name)}</span>
      <span class="name ${p.is_alive ? '' : 'dead-text'}">${p.name}</span>
      ${p.name === room.chief_name ? '<span class="host-badge">TRƯỞNG LÀNG</span>' : ''}
    </div>
  `).join("");
}

function renderLobby(room) {
  document.getElementById("player-count").textContent = room.players.length;
  document.getElementById("player-list").innerHTML = room.players.map(p => `
    <div class="player-row-v2">
      <span class="avatar" style="background:${avatarColor(p.name)}">${initials(p.name)}</span>
      <span class="name">${p.name}</span>
    </div>
  `).join("");
  const startBtn = document.getElementById("start-btn");
  if (room.players.length >= 5) {
    startBtn.disabled = false;
    startBtn.textContent = `Bắt đầu trò chơi (${room.players.length} người)`;
  } else {
    startBtn.disabled = true;
    startBtn.textContent = `Cần thêm người chơi (${room.players.length}/5)`;
  }
}

function renderElection(info, room) {
  if (room.seconds_left !== null && room.seconds_left !== undefined) {
    startCountdown(room.seconds_left, "election-countdown-fill", "election-countdown-text", "Thời gian bầu cử");
  }
  document.getElementById("election-progress").textContent = `${room.election_votes_count ?? 0}/${room.alive_count} người đã bỏ phiếu`;

  const area = document.getElementById("election-area");
  if (!info.is_alive) {
    area.innerHTML = `<p class="muted">Bạn đã bị loại, chỉ có thể theo dõi.</p>`;
    return;
  }
  if (info.has_voted_election) {
    area.innerHTML = `<p class="muted">Bạn đã bỏ phiếu. Đang chờ những người còn lại...</p>`;
    return;
  }

  const targets = info.all_alive_players || [];
  area.innerHTML = `
    <div class="radio-list" id="election-list">
      ${targets.map(name => `
        <label class="radio-item">
          <input type="radio" name="chief-choice" value="${name}">
          <span>${name}${name === session.name ? " (bạn)" : ""}</span>
        </label>
      `).join("")}
      <label class="radio-item">
        <input type="radio" name="chief-choice" value="">
        <span>Không bầu ai</span>
      </label>
    </div>
    <button class="btn-primary" id="election-vote-btn" disabled>Xác nhận</button>
  `;
  let choice = "";
  document.querySelectorAll('input[name="chief-choice"]').forEach(el => {
    el.addEventListener("change", (e) => {
      choice = e.target.value;
      document.getElementById("election-vote-btn").disabled = false;
    });
  });
  document.getElementById("election-vote-btn").addEventListener("click", async () => {
    const { ok, data } = await apiPost("/api/election-vote", { room_code: session.room, voter_name: session.name, choice_name: choice });
    if (!ok || !data.success) return showToast(data.message || "Lỗi", true);
    showToast(data.message);
    refresh();
  });
}

function renderTransition(info, room) {
  const isReveal = room.transition_kind === "reveal";
  document.getElementById("transition-title").textContent = isReveal ? "Công bố kết quả" : "Chuẩn bị...";
  document.getElementById("transition-msg").textContent = room.transition_message || "";
  if (room.seconds_left !== null && room.seconds_left !== undefined) {
    startCountdown(room.seconds_left, "transition-countdown-fill", "transition-countdown-text", isReveal ? "Chuyển cảnh sau" : "Bắt đầu sau");
  }
}

function renderNightTracker(room) {
  const sequence = room.night_sequence || [];
  const currentIdx = sequence.indexOf(room.subphase);
  const steps = NIGHT_STEPS.filter(s => sequence.includes(s.key));
  const html = steps.map(s => {
    const idx = sequence.indexOf(s.key);
    let cls = "";
    if (s.key === room.subphase) cls = "active";
    else if (currentIdx >= 0 && idx < currentIdx) cls = "done";
    return `<div class="night-step ${cls}">${s.label}</div>`;
  });
  document.getElementById("night-tracker").innerHTML = html.join(`<div class="night-connector"></div>`);
}

function startCountdown(seconds, fillId, textId, label) {
  clearInterval(countdownTimer);
  localSecondsLeft = seconds;
  const total = Math.max(seconds, 1);
  const update = () => {
    const fill = document.getElementById(fillId);
    const text = document.getElementById(textId);
    if (!fill || !text) return;
    const pct = Math.max(0, Math.min(100, (localSecondsLeft / total) * 100));
    fill.style.width = pct + "%";
    text.textContent = localSecondsLeft > 0 ? `${label}: còn ${localSecondsLeft}s` : `${label}: đang xử lý...`;
  };
  update();
  countdownTimer = setInterval(() => {
    localSecondsLeft = Math.max(0, localSecondsLeft - 1);
    update();
    if (localSecondsLeft <= 0) clearInterval(countdownTimer);
  }, 1000);
}

function renderNight(info, room) {
  document.getElementById("night-day-num").textContent = room.day_count;
  renderNightTracker(room);

  if (room.seconds_left !== null && room.seconds_left !== undefined) {
    startCountdown(room.seconds_left, "countdown-fill", "countdown-text", room.subphase_label || "Đang xử lý");
  }

  const banner = document.getElementById("turn-banner");
  const actionPanel = document.getElementById("action-panel");

  if (!info.is_alive) {
    banner.innerHTML = `<div class="turn-banner waiting">Bạn đã bị loại — hãy nhắm mắt và giữ im lặng.</div>`;
    actionPanel.style.display = "none";
    return;
  }

  if (info.my_turn) {
    banner.innerHTML = `<div class="turn-banner">Đến lượt bạn — hãy thao tác trong im lặng.</div>`;
    actionPanel.style.display = "block";
    renderAction(info, room);
  } else {
    banner.innerHTML = `<div class="turn-banner waiting">${room.subphase_label || "Đang chờ"}... Hãy nhắm mắt và giữ im lặng.</div>`;
    actionPanel.style.display = "none";
  }
}

function renderAction(info, room) {
  const targetList = document.getElementById("target-list");
  const witchBox = document.getElementById("witch-actions");
  const seerBox = document.getElementById("seer-result");
  witchBox.innerHTML = "";
  seerBox.innerHTML = "";
  targetList.innerHTML = "";
  const targets = info.alive_players || [];

  if (info.role === "Ma Sói") {
    document.getElementById("action-desc").textContent = "Im lặng, chọn người bạn muốn tiêu diệt.";
    targetList.innerHTML = targets.map(name => `<button class="target-btn" data-name="${name}">${name}</button>`).join("");
    targetList.querySelectorAll(".target-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const { ok, data } = await apiPost("/api/wolf-action", { room_code: session.room, wolf_name: session.name, target_name: btn.dataset.name });
        if (!ok || !data.success) return showToast(data.message || "Lỗi", true);
        showToast(data.message);
        refresh();
      });
    });
  }

  if (info.role === "Bảo Vệ") {
    document.getElementById("action-desc").textContent = "Chọn người bạn muốn che chở đêm nay.";
    targetList.innerHTML = targets.map(name => `<button class="target-btn" data-name="${name}">${name}</button>`).join("");
    targetList.querySelectorAll(".target-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const { ok, data } = await apiPost("/api/guard-action", { room_code: session.room, guard_name: session.name, target_name: btn.dataset.name });
        if (!ok || !data.success) return showToast(data.message || "Lỗi", true);
        showToast(data.message);
        refresh();
      });
    });
  }

  if (info.role === "Tiên Tri") {
    document.getElementById("action-desc").textContent = "Chọn một người để soi danh tính.";
    targetList.innerHTML = targets.map(name => `<button class="target-btn" data-name="${name}">${name}</button>`).join("") +
      `<button class="target-btn" id="seer-pass-btn">Bỏ qua lượt</button>`;
    targetList.querySelectorAll(".target-btn[data-name]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const { ok, data } = await apiPost("/api/seer-action", { room_code: session.room, seer_name: session.name, target_name: btn.dataset.name });
        if (!ok || !data.success) return showToast(data.message || "Lỗi", true);
        seerBox.innerHTML = `<p style="margin-top:14px;"><strong>${data.target}</strong> là: <span style="color:var(--dawn-300)">${data.role_hint}</span></p>`;
        targetList.querySelectorAll("button").forEach(b => b.disabled = true);
        setTimeout(refresh, 1200);
      });
    });
    const passBtn = document.getElementById("seer-pass-btn");
    if (passBtn) passBtn.addEventListener("click", async () => {
      const { ok, data } = await apiPost("/api/seer-pass", { room_code: session.room, seer_name: session.name });
      if (!ok || !data.success) return showToast(data.message || "Lỗi", true);
      refresh();
    });
  }

  if (info.role === "Phù Thủy") {
    document.getElementById("action-desc").textContent = "Bạn có một bình cứu và một bình độc, mỗi bình chỉ dùng được một lần trong cả ván.";
    let html = "";
    if (info.wolf_victim_hint) {
      html += `<p>Đêm nay <strong>${info.wolf_victim_hint}</strong> bị Sói cắn.</p>`;
      if (!info.witch_used_save) {
        html += `<button class="btn-leaf btn-small" id="witch-save">Dùng bình cứu cho ${info.wolf_victim_hint}</button>`;
      } else {
        html += `<p class="muted">Bạn đã dùng hết bình cứu.</p>`;
      }
    } else {
      html += `<p class="muted">Đêm nay chưa ai bị Sói cắn.</p>`;
    }
    witchBox.innerHTML = html;

    const saveBtn = document.getElementById("witch-save");
    if (saveBtn) saveBtn.addEventListener("click", async () => {
      const { ok, data } = await apiPost("/api/witch-action", { room_code: session.room, witch_name: session.name, action_type: "save" });
      if (!ok || !data.success) return showToast(data.message || "Lỗi", true);
      showToast(data.message);
      refresh();
    });

    if (!info.witch_used_kill) {
      targetList.innerHTML = `<p class="muted" style="grid-column:1/-1;margin-bottom:4px;">Hoặc dùng bình độc lên:</p>` +
        targets.map(name => `<button class="target-btn" data-name="${name}">${name}</button>`).join("");
      targetList.querySelectorAll(".target-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const { ok, data } = await apiPost("/api/witch-action", { room_code: session.room, witch_name: session.name, action_type: "kill", target_name: btn.dataset.name });
          if (!ok || !data.success) return showToast(data.message || "Lỗi", true);
          showToast(data.message);
          refresh();
        });
      });
    }

    const doneBtn = document.createElement("button");
    doneBtn.className = "btn-ghost btn-small";
    doneBtn.style.marginTop = "14px";
    doneBtn.textContent = "Xong lượt của tôi";
    doneBtn.addEventListener("click", async () => {
      const { ok, data } = await apiPost("/api/witch-done", { room_code: session.room, witch_name: session.name });
      if (!ok || !data.success) return showToast(data.message || "Lỗi", true);
      refresh();
    });
    witchBox.appendChild(doneBtn);
  }
}

function renderDay(info, room) {
  document.getElementById("day-day-num").textContent = room.day_count;
  document.getElementById("day-result-msg").textContent = room.last_night_msg || "Cả làng cùng thảo luận để tìm ra Sói.";

  if (room.seconds_left !== null && room.seconds_left !== undefined) {
    startCountdown(room.seconds_left, "day-countdown-fill", "day-countdown-text", "Thời gian bỏ phiếu");
  }

  document.getElementById("vote-progress").textContent = `${room.votes_count ?? 0}/${room.alive_count} người đã bỏ phiếu`;

  const area = document.getElementById("vote-area");
  if (!info.is_alive) {
    area.innerHTML = `<p class="muted">Bạn đã bị loại, chỉ có thể theo dõi cuộc bỏ phiếu.</p>`;
    return;
  }
  if (info.has_voted) {
    area.innerHTML = `<p class="muted">Bạn đã bỏ phiếu. Đang chờ những người còn lại...</p>`;
    return;
  }

  const targets = info.alive_players || [];
  area.innerHTML = `
    <div class="radio-list" id="vote-list">
      ${targets.map(name => `
        <label class="radio-item">
          <input type="radio" name="suspect" value="${name}">
          <span>${name}</span>
        </label>
      `).join("")}
      <label class="radio-item">
        <input type="radio" name="suspect" value="">
        <span>Bỏ phiếu trắng</span>
      </label>
    </div>
    <button class="btn-danger" id="vote-btn" disabled>Xác nhận phiếu bầu</button>
  `;
  document.querySelectorAll('input[name="suspect"]').forEach(el => {
    el.addEventListener("change", (e) => {
      selectedSuspect = e.target.value;
      document.getElementById("vote-btn").disabled = false;
    });
  });
  document.getElementById("vote-btn").addEventListener("click", async () => {
    const { ok, data } = await apiPost("/api/day-vote", { room_code: session.room, voter_name: session.name, suspect_name: selectedSuspect });
    if (!ok || !data.success) return showToast(data.message || "Lỗi", true);
    showToast(data.message);
    refresh();
  });
}

function renderEnd(info, room) {
  if (finalFetched) return;
  finalFetched = true;
  apiPost("/api/check-win", { room_code: session.room }).then(({ ok, data }) => {
    if (!ok || !data.success) return;
    const iWon = (data.winner === "soi" && info.role === "Ma Sói") || (data.winner === "dan" && info.role !== "Ma Sói");
    document.getElementById("end-title").textContent = data.message;
    const tag = document.getElementById("end-tag");
    tag.textContent = iWon ? "VICTORY" : "LOSE";
    tag.style.color = iWon ? "var(--leaf-400)" : "var(--blood-400)";
    document.getElementById("end-role-reveal").textContent = `Vai trò của bạn là: ${info.role}`;
    document.getElementById("result-body").innerHTML = (data.results || []).map(r => `
      <tr>
        <td>${r.name}</td>
        <td>${r.role}</td>
        <td class="${r.result === 'VICTORY' ? 'result-victory' : 'result-lose'}">${r.result}</td>
      </tr>
    `).join("");
  });
}

document.getElementById("start-btn").addEventListener("click", async () => {
  const { ok, data } = await apiPost("/api/start-game", { room_code: session.room });
  if (!ok || !data.success) return showToast(data.message || "Không thể bắt đầu", true);
  showToast("Trò chơi bắt đầu!");
  refresh();
});

refresh();
setInterval(refresh, 2500);
