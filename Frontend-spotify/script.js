const API =
 location.hostname === "localhost"
   ? "http://localhost:3000"
   : "https://spotify-songs-backend-krsd.onrender.com"; // your production URL here
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function sendOtp(){
  await fetch("/api/auth/send-otp-register",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({email:email.value})
  });
  alert("OTP sent");
}
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
async function verifyOtp(){
  await fetch("/api/auth/verify-otp-register",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      username:username.value,
      email:email.value,
      password:password.value,
      role:role.value,
      otp:otp.value
    })
  });
  alert("Registered");
}
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
async function sendForgot(){
  await fetch("/api/auth/send-otp-forgot",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({email:femail.value})
  });
  alert("OTP sent");
}
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
async function reset(){
  await fetch("/api/auth/reset-password",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      email:femail.value,
      otp:fotp.value,
      newPassword:newpass.value
    })
  });
  alert("Password updated");
}


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Registration
const registerBtn=document.getElementById("register-account");
if(registerBtn){
    registerBtn.addEventListener("click", async function(e) {
        e.preventDefault();
        showLoader();
        const res=await fetch(`${API}/api/auth/register`,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            credentials:"include",
            body:JSON.stringify({
                username:ruser.value,
                email:remail.value,
                password:rpass.value,
                role:rrole.value
            })
        })
        const data=await res.json()
        alert(data.message);
        if(res.ok) {window.location.href = "login.html";}
        hideLoader();
    });
}
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Login
const loginBtn = document.getElementById("login-account");

if (loginBtn) {
  loginBtn.addEventListener("click", async function(e){
    e.preventDefault();
    showLoader();
    const res = await fetch(`${API}/api/auth/login`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      credentials:"include",
      body:JSON.stringify({
        email:document.getElementById("lemail").value,
        password:document.getElementById("lpass").value
      })
    });

    const data = await res.json();
    alert(data.message);

    if(res.ok){
      localStorage.setItem("user", JSON.stringify(data.user));
      if(data.user.role === "artist"){
        window.location.href="artist-profile.html";
      } 
      else if(data.user.role === "user"){
        window.location.href="user-profile.html";
      }
    }
    hideLoader();
  });
}
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Logout
const logoutBtn = document.getElementById("logout");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async function(){
    showLoader();
    await fetch(`${API}/api/auth/logout`,{
      method:"POST",
      credentials:"include"
    });
    alert("Logged out successfully");
    localStorage.removeItem("user");
    window.location.href="login.html";
    hideLoader();
  });
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

const pageHeading = document.getElementById("page-heading");

if(pageHeading){
  const user = JSON.parse(localStorage.getItem("user"));
  if(user){
    pageHeading.innerHTML = `Welcome ${user.username}`;
  }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function loadUserCount(){
  try{
    const res = await fetch(`${API}/api/auth/count`);
    const data = await res.json();

    const el = document.getElementById("user-count");
    if(el){
      el.innerText = `Total registered users: ${data.count}`;
    }
  }catch(err){
    console.log("Count fetch error", err);
  }
}

loadUserCount();
setInterval(loadUserCount, 120000);


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function showLoader(){
  const loader = document.getElementById("loader");
  if(loader) loader.classList.remove("hidden");
}

function hideLoader(){
  const loader = document.getElementById("loader");
  if(loader) loader.classList.add("hidden");
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function checkLogin(){

  // run only on public pages
  const path = window.location.pathname.toLowerCase();

  const isPublicPage =
      path.endsWith("index.html") ||
      path.endsWith("login.html") ||
      path.endsWith("register.html") ||
      path === "/" ||
      path === "";

  if(!isPublicPage) return;

  showLoader();

  try{
    const res = await fetch(`${API}/api/auth/me`,{
      method:"GET",
      credentials:"include"
    });

    if(!res.ok){
      hideLoader();
      return;
    }

    const data = await res.json();

    if(data?.user){
      localStorage.setItem("user", JSON.stringify(data.user));
      
      const path = window.location.pathname;

      // If on index page → just alert
      if (path.includes("index.html") || path === "/") {
          alert("Already logged in. To register a new account, logout first.");
          hideLoader();
          // return;
      }
     
      // small delay so loader shows nicely
      setTimeout(()=>{
        if(data.user.role === "artist"){
          window.location.replace("artist-profile.html");
        } else {
          window.location.replace("user-profile.html");
        }
      }, 500);
    }
    else{
      hideLoader();
    }

  }catch(err){
    hideLoader();
  }
}

checkLogin();
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++



