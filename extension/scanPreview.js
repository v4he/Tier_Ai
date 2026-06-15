// const selectedImageUrl = null

// imagePicker.innerHTML = "";
//       imageCandidates.forEach((src, index) => {
//         const img = document.createElement("img");
//         img.src = src;
//         img.classList.add("picker-img");
//         if (index === 0) img.classList.add("selected");

//         img.addEventListener("click", (e) => {
//           document
//             .querySelectorAll(".picker-img")
//             .forEach((el) => el.classList.remove("selected"));
//           e.target.classList.add("selected");
//           selectedImageUrl = e.target.src;
          
//           chrome.storage.local.set({selectedImageUrl: e.target.src })
//         });

//         imagePicker.appendChild(img);
//       });

//       previewBlock.style.display = "block";