document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> <span class="spots-left">${spotsLeft}</span> spots left</p>
        `;

        // Add participants section
        const participantsHeader = document.createElement("h5");
        participantsHeader.textContent = "Participants";
        participantsHeader.className = "participants-header";
        activityCard.appendChild(participantsHeader);

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";

        if (details.participants && details.participants.length > 0) {
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";
            li.innerHTML = `
              <span class="participant-email">${p}</span>
              <button class="participant-remove" aria-label="Unregister ${p}">&times;</button>
            `;

            // Attach delete handler
            const removeBtn = li.querySelector(".participant-remove");
            removeBtn.addEventListener("click", async (ev) => {
              ev.stopPropagation();
              const email = p;
              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(email)}`,
                  { method: "DELETE" }
                );

                const data = await resp.json();
                if (resp.ok) {
                  // Remove from DOM
                  li.remove();

                  // Update spots left display
                  const spotsSpan = activityCard.querySelector(".spots-left");
                  if (spotsSpan) {
                    const current = parseInt(spotsSpan.textContent, 10);
                    spotsSpan.textContent = String(current + 1);
                  }

                  // If no participants left, show empty message
                  if (participantsList.querySelectorAll(".participant-item").length === 0) {
                    const empty = document.createElement("li");
                    empty.className = "participant-empty";
                    empty.textContent = "No participants yet";
                    participantsList.appendChild(empty);
                  }
                } else {
                  console.error("Failed to remove participant:", data);
                  alert(data.detail || "Failed to remove participant");
                }
              } catch (error) {
                console.error("Error removing participant:", error);
                alert("Error removing participant. Check console for details.");
              }
            });

            participantsList.appendChild(li);
          });
        } else {
          const empty = document.createElement("li");
          empty.className = "participant-empty";
          empty.textContent = "No participants yet";
          participantsList.appendChild(empty);
        }

        activityCard.appendChild(participantsList);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
