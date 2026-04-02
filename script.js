const storageKey = "bugTrackerProData_v2";
    let editingId = null;

    

    let bugs = JSON.parse(localStorage.getItem(storageKey)) || [];

    const form = document.getElementById("bugForm");
    const submitBtn = document.getElementById("submitBtn");
    const resetBtn = document.getElementById("resetBtn");
    const duplicateBtn = document.getElementById("duplicateBtn");
    const tableBody = document.getElementById("bugTableBody");
    const emptyState = document.getElementById("emptyState");

    const fields = {
      title: document.getElementById("title"),
      description: document.getElementById("description"),
      artifactType: document.getElementById("artifactType"),
      artifactName: document.getElementById("artifactName"),
      bugType: document.getElementById("bugType"),
      severity: document.getElementById("severity"),
      status: document.getElementById("status"),
      reportedBy: document.getElementById("reportedBy"),
      dateFound: document.getElementById("dateFound"),
      dateFixed: document.getElementById("dateFixed"),
    };

    const searchInput = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");
    const severityFilter = document.getElementById("severityFilter");
    const artifactFilter = document.getElementById("artifactFilter");

    function saveData() {
      localStorage.setItem(storageKey, JSON.stringify(bugs));
    }

    function formatDate(dateStr) {
      if (!dateStr) return "—";
      return dateStr;
    }

    function badgeClassForStatus(status) {
      if (status === "Open") return "status-open";
      if (status === "In Progress") return "status-progress";
      return "status-fixed";
    }

    function badgeClassForSeverity(severity) {
      const map = {
        Low: "sev-low",
        Medium: "sev-medium",
        High: "sev-high",
        Critical: "sev-critical"
      };
      return map[severity] || "sev-low";
    }

    function updateStats() {
      const total = bugs.length;
      const open = bugs.filter(b => b.status === "Open").length;
      const progress = bugs.filter(b => b.status === "In Progress").length;
      const fixed = bugs.filter(b => b.status === "Fixed").length;
      const high = bugs.filter(b => b.severity === "High" || b.severity === "Critical").length;

      document.getElementById("totalCount").textContent = total;
      document.getElementById("openCount").textContent = open;
      document.getElementById("progressCount").textContent = progress;
      document.getElementById("fixedCount").textContent = fixed;
      document.getElementById("highCount").textContent = high;
    }

    function getFilteredBugs() {
      const query = searchInput.value.trim().toLowerCase();
      return bugs.filter(bug => {
        const matchesQuery =
          bug.title.toLowerCase().includes(query) ||
          bug.artifactName.toLowerCase().includes(query) ||
          bug.bugType.toLowerCase().includes(query) ||
          bug.reportedBy.toLowerCase().includes(query);

        const matchesStatus = statusFilter.value === "All" || bug.status === statusFilter.value;
        const matchesSeverity = severityFilter.value === "All" || bug.severity === severityFilter.value;
        const matchesArtifact = artifactFilter.value === "All" || bug.artifactType === artifactFilter.value;

        return matchesQuery && matchesStatus && matchesSeverity && matchesArtifact;
      });
    }

    function renderTable() {
      const filtered = getFilteredBugs();
      tableBody.innerHTML = "";

      document.getElementById("registryCount").textContent = `${filtered.length} issue${filtered.length === 1 ? "" : "s"} shown`;

      if (!filtered.length) {
        emptyState.style.display = "block";
        return;
      }
      emptyState.style.display = "none";

      filtered.forEach(bug => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>
            <div class="bug-title">${bug.title}</div>
            <div class="bug-sub">${bug.description || "No description provided."}</div>
          </td>
          <td>
            <div><strong>${bug.artifactName || "—"}</strong></div>
            <div class="bug-sub">${bug.artifactType}</div>
          </td>
          <td>${bug.bugType}</td>
          <td><span class="badge ${badgeClassForSeverity(bug.severity)}">${bug.severity}</span></td>
          <td><span class="badge ${badgeClassForStatus(bug.status)}">${bug.status}</span></td>
          <td>${bug.reportedBy || "—"}</td>
          <td>${formatDate(bug.dateFound)}</td>
          <td>${formatDate(bug.dateFixed)}</td>
          <td>
            <div class="actions-inline">
              <button class="btn btn-secondary small" onclick="editBug(${bug.id})">Edit</button>
              <button class="btn btn-secondary small" onclick="moveStatus(${bug.id})">Next Status</button>
              <button class="btn btn-danger small" onclick="deleteBug(${bug.id})">Delete</button>
            </div>
          </td>
        `;
        tableBody.appendChild(row);
      });
    }

    function resetForm() {
      form.reset();
      editingId = null;
      submitBtn.textContent = "Add Bug";
      fields.dateFound.value = new Date().toISOString().split("T")[0];
    }

    function editBug(id) {
      const bug = bugs.find(b => b.id === id);
      if (!bug) return;
      editingId = id;
      fields.title.value = bug.title;
      fields.description.value = bug.description;
      fields.artifactType.value = bug.artifactType;
      fields.artifactName.value = bug.artifactName;
      fields.bugType.value = bug.bugType;
      fields.severity.value = bug.severity;
      fields.status.value = bug.status;
      fields.reportedBy.value = bug.reportedBy;
      fields.dateFound.value = bug.dateFound;
      fields.dateFixed.value = bug.dateFixed;
      submitBtn.textContent = "Update Bug";
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function moveStatus(id) {
      const bug = bugs.find(b => b.id === id);
      if (!bug) return;

      if (bug.status === "Open") {
        bug.status = "In Progress";
      } else if (bug.status === "In Progress") {
        bug.status = "Fixed";
        if (!bug.dateFixed) {
          bug.dateFixed = new Date().toISOString().split("T")[0];
        }
      } else {
        bug.status = "Open";
        bug.dateFixed = "";
      }

      saveData();
      updateStats();
      renderTable();
    }

    function deleteBug(id) {
      bugs = bugs.filter(b => b.id !== id);
      saveData();
      updateStats();
      renderTable();
      if (editingId === id) resetForm();
    }

    form.addEventListener("submit", function(e) {
      e.preventDefault();

      const payload = {
        title: fields.title.value.trim(),
        description: fields.description.value.trim(),
        artifactType: fields.artifactType.value,
        artifactName: fields.artifactName.value.trim(),
        bugType: fields.bugType.value,
        severity: fields.severity.value,
        status: fields.status.value,
        reportedBy: fields.reportedBy.value.trim(),
        dateFound: fields.dateFound.value || new Date().toISOString().split("T")[0],
        dateFixed: fields.status.value === "Fixed" ? (fields.dateFixed.value || new Date().toISOString().split("T")[0]) : fields.dateFixed.value
      };

      if (!payload.title) return;

      if (editingId !== null) {
        bugs = bugs.map(b => b.id === editingId ? { ...b, ...payload } : b);
      } else {
        bugs.unshift({
          id: Date.now(),
          ...payload
        });
      }

      saveData();
      updateStats();
      renderTable();
      resetForm();
    });

    resetBtn.addEventListener("click", resetForm);

    duplicateBtn.addEventListener("click", function() {
      const note = document.getElementById("duplicateNote");
      note.style.display = "block";
      note.textContent = "Duplicate detection failed: feature not implemented.";

      setTimeout(() => {
        note.style.display = "none";
      }, 2000);
    });
    searchInput.addEventListener("input", renderTable);
    statusFilter.addEventListener("change", renderTable);
    severityFilter.addEventListener("change", renderTable);
    artifactFilter.addEventListener("change", renderTable);

    fields.status.addEventListener("change", () => {
      if (fields.status.value !== "Fixed") fields.dateFixed.value = "";
      if (fields.status.value === "Fixed" && !fields.dateFixed.value) {
        fields.dateFixed.value = new Date().toISOString().split("T")[0];
      }
    });

    fields.dateFound.value = new Date().toISOString().split("T")[0];
    updateStats();
    renderTable();
