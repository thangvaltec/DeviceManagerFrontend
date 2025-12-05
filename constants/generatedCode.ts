



// Clean version for downloading Program.cs directly
export const DOWNLOADABLE_PROGRAM_CS = `using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

// --- 1. Setup Builder ---
var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
// Configure SQL Server Connection
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// --- 2. Middleware ---
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();

// --- 3. Database Context ---
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Device> Devices { get; set; }
    public DbSet<DeviceLog> DeviceLogs { get; set; }
    public DbSet<AdminUser> AdminUsers { get; set; }
}

// --- 4. Data Models ---
public class Device
{
    [Key]
    public string SerialNo { get; set; } // Can be HW Serial or Manual Device ID
    public string DeviceName { get; set; }
    public int AuthMode { get; set; } // 0=Face, 1=Vein, 2=Face+Vein
    public bool IsActive { get; set; }
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}

public class DeviceLog
{
    public int Id { get; set; }
    public string SerialNo { get; set; }
    public string ChangeType { get; set; } // CREATE, UPDATE, DELETE
    public string ChangeDetails { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string AdminUser { get; set; }
}

public class AdminUser
{
    public int Id { get; set; }
    public string Username { get; set; }
    public string PasswordHash { get; set; }
    public string Role { get; set; } = "admin"; // 'super_admin' or 'admin'
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// DTOs
public class CreateUserRequest {
    public string Username { get; set; }
    public string Password { get; set; }
    public string Role { get; set; }
}

public class UpdateUserRequest {
    public string? Password { get; set; }
    public string? Role { get; set; }
}

public class GetAuthModeRequest
{
    public string SerialNo { get; set; }
}

// --- 5. API Controllers ---

[Route("api/device")]
[ApiController]
public class DeviceController : ControllerBase
{
    private readonly AppDbContext _context;

    public DeviceController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("getAuthMode")]
    public async Task<IActionResult> GetAuthMode([FromBody] GetAuthModeRequest request)
    {
        var device = await _context.Devices.FindAsync(request.SerialNo);
        if (device == null) return NotFound(new { message = "Device not registered" });

        return Ok(new 
        { 
            authMode = device.AuthMode, 
            deviceName = device.DeviceName,
            isActive = device.IsActive 
        });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _context.Devices.ToListAsync());
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Device device)
    {
        if (await _context.Devices.AnyAsync(d => d.SerialNo == device.SerialNo))
            return BadRequest("ID/Serial already exists");

        device.LastUpdated = DateTime.UtcNow;
        _context.Devices.Add(device);
        
        _context.DeviceLogs.Add(new DeviceLog 
        { 
            SerialNo = device.SerialNo, 
            ChangeType = "CREATE", 
            ChangeDetails = $"Device registered: {device.DeviceName}",
            AdminUser = "admin" // In real app, get from Claim
        });

        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAuthMode), new { serialNo = device.SerialNo }, device);
    }

    [HttpPut("{serialNo}")]
    public async Task<IActionResult> Update(string serialNo, [FromBody] Device updated)
    {
        var device = await _context.Devices.FindAsync(serialNo);
        if (device == null) return NotFound();

        device.DeviceName = updated.DeviceName;
        device.AuthMode = updated.AuthMode;
        device.IsActive = updated.IsActive;
        device.LastUpdated = DateTime.UtcNow;

        _context.DeviceLogs.Add(new DeviceLog 
        { 
            SerialNo = serialNo, 
            ChangeType = "UPDATE", 
            ChangeDetails = $"Updated settings. Mode: {updated.AuthMode}",
            AdminUser = "admin"
        });

        await _context.SaveChangesAsync();
        return NoContent();
    }
    
    [HttpGet("logs/{serialNo}")]
    public async Task<IActionResult> GetLogs(string serialNo)
    {
        var logs = await _context.DeviceLogs
            .Where(l => l.SerialNo == serialNo)
            .OrderByDescending(l => l.Timestamp)
            .ToListAsync();
        return Ok(logs);
    }
}

// User Management Controller
[Route("api/users")]
[ApiController]
public class UserController : ControllerBase
{
    private readonly AppDbContext _context;
    public UserController(AppDbContext context) { _context = context; }

    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        // Add Authorization check: Must be Super Admin
        return Ok(await _context.AdminUsers.Select(u => new { u.Id, u.Username, u.Role, u.CreatedAt }).ToListAsync());
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest req)
    {
        if (await _context.AdminUsers.AnyAsync(u => u.Username == req.Username))
            return BadRequest("Username exists");

        var user = new AdminUser {
            Username = req.Username,
            Role = req.Role,
            // In real app: Use BCrypt.HashPassword(req.Password)
            PasswordHash = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(req.Password)) 
        };

        _context.AdminUsers.Add(user);
        await _context.SaveChangesAsync();
        return Ok(new { user.Id, user.Username });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest req)
    {
        var user = await _context.AdminUsers.FindAsync(id);
        if (user == null) return NotFound();

        if (!string.IsNullOrEmpty(req.Role)) user.Role = req.Role;
        if (!string.IsNullOrEmpty(req.Password)) {
            user.PasswordHash = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(req.Password));
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }
    
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.AdminUsers.FindAsync(id);
        if (user == null) return NotFound();
        _context.AdminUsers.Remove(user);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
`;

export const DOWNLOADABLE_APPSETTINGS = `{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Server=.\\\\SQLEXPRESS;Database=DeviceDb;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}`;

// --- EXISTING DISPLAY CODE BELOW ---

export const CS_BACKEND_CODE = DOWNLOADABLE_PROGRAM_CS;

export const RAZOR_FRONTEND_CODE = `
// --- Pages/Users/Index.cshtml ---
@page
@model UserListModel
@{ ViewData["Title"] = "User Management"; }

<h2>ユーザー管理</h2>
<!-- See generated code for full list implementation -->
`;

export const SQL_SCHEMA_CODE = `
-- Create Devices Table
CREATE TABLE devices (
    serial_no NVARCHAR(50) NOT NULL PRIMARY KEY, -- Stores either Manual ID (e.g. 222222) or HW Serial (e.g. KF5KW...)
    device_name NVARCHAR(100) NOT NULL,
    auth_mode INT NOT NULL DEFAULT 0, -- 0:Face, 1:Vein, 2:Both
    is_active BIT NOT NULL DEFAULT 1,
    last_updated DATETIME2 DEFAULT SYSDATETIME()
);

-- Create Device Logs Table
CREATE TABLE device_logs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    serial_no NVARCHAR(50) NOT NULL,
    change_type NVARCHAR(20) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
    change_details NVARCHAR(MAX),
    timestamp DATETIME2 DEFAULT SYSDATETIME(),
    admin_user NVARCHAR(50),
    CONSTRAINT FK_DeviceLogs_Devices FOREIGN KEY (serial_no) REFERENCES devices(serial_no) ON DELETE CASCADE
);

-- Create Admin Users Table
CREATE TABLE admin_users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50) NOT NULL UNIQUE,
    password_hash NVARCHAR(256) NOT NULL,
    role NVARCHAR(20) NOT NULL DEFAULT 'admin', -- 'super_admin' or 'admin'
    created_at DATETIME2 DEFAULT SYSDATETIME()
);

-- Indexes
CREATE INDEX IX_DeviceLogs_SerialNo ON device_logs(serial_no);

-- Seed Super Admin
INSERT INTO admin_users (username, password_hash, role) VALUES ('admin', 'hashed_secret', 'super_admin');
`;

export const KOTLIN_ANDROID_CODE = `
package com.example.bodycamera.auth

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException

// Add to AndroidManifest.xml: 
// <uses-permission android:name="android.permission.INTERNET" />
// <uses-permission android:name="android.permission.READ_PHONE_STATE" />

class MainActivity : AppCompatActivity() {

    private val client = OkHttpClient()
    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()
    
    // Server URL
    private val baseUrl = "http://192.168.1.100:5000/api/device"

    private lateinit var etDeviceId: EditText
    private lateinit var btnSave: Button
    private lateinit var tvStatus: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        etDeviceId = findViewById(R.id.etDeviceId)
        btnSave = findViewById(R.id.btnSave)
        tvStatus = findViewById(R.id.tvStatus)

        // 1. Try to auto-detect hardware serial
        val hwSerial = getDeviceSerialNumber()
        if (hwSerial != "UNKNOWN") {
            etDeviceId.setText(hwSerial)
            // AUTO START: If serial is found, check server immediately
            checkAuthMode(hwSerial)
        } else {
            // 2. Fallback: Load saved ID from preferences
            val prefs = getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
            val savedId = prefs.getString("device_id", "")
            etDeviceId.setText(savedId)
            
            // If we have a saved ID, also auto-start
            if (!savedId.isNullOrEmpty()) {
                checkAuthMode(savedId)
            }
        }

        btnSave.setOnClickListener {
            val id = etDeviceId.text.toString()
            saveDeviceId(id)
            checkAuthMode(id)
        }
    }

    /**
     * Gets the hardware serial number using reflection (vendor.gsm.serial)
     * Compatible with custom body camera ROMs.
     */
    @SuppressLint("PrivateApi")
    private fun getDeviceSerialNumber(): String {
        return try {
            val clazz = Class.forName("android.os.SystemProperties")
            val get = clazz.getMethod("get", String::class.java)

            // Try vendor specific serial first (Common in custom devices)
            val serial = get.invoke(null, "vendor.gsm.serial") as String

            if (!serial.isNullOrEmpty() && serial != "unknown") {
                serial 
            } else {
                // Fallback to standard serial
                val stdSerial = get.invoke(null, "ro.serialno") as String
                if (!stdSerial.isNullOrEmpty()) stdSerial else "UNKNOWN"
            }
        } catch (e: Exception) {
            "UNKNOWN"
        }
    }

    private fun saveDeviceId(id: String) {
        val prefs = getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        prefs.edit().putString("device_id", id).apply()
    }

    private fun checkAuthMode(serialNo: String) {
        val jsonBody = JSONObject().put("serialNo", serialNo).toString()
        val request = Request.Builder()
            .url("$baseUrl/getAuthMode")
            .post(jsonBody.toRequestBody(jsonMediaType))
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                runOnUiThread { tvStatus.text = "Connection Error: \${e.message}" }
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    if (!it.isSuccessful) {
                        runOnUiThread { tvStatus.text = "API Error: \${response.code}" }
                        return
                    }
                    val json = JSONObject(it.body!!.string())
                    val mode = json.optInt("authMode")
                    val isActive = json.optBoolean("isActive")
                    
                    runOnUiThread { 
                        if (!isActive) {
                             tvStatus.text = "Device is Disabled"
                             return@runOnUiThread
                        }

                        // JUMP TO AUTH SCREEN IMMEDIATELY
                        when (mode) {
                            0 -> startFaceAuth()
                            1 -> startVeinAuth()
                            2 -> startDualAuth()
                            else -> tvStatus.text = "Unknown Mode: $mode"
                        }
                    }
                }
            }
        })
    }

    // --- Mock Navigation Functions ---
    private fun startFaceAuth() {
        Toast.makeText(this, "Starting Face Auth...", Toast.LENGTH_SHORT).show()
        // val intent = Intent(this, FaceAuthActivity::class.java)
        // startActivity(intent)
        // finish()
    }

    private fun startVeinAuth() {
        Toast.makeText(this, "Starting Vein Auth...", Toast.LENGTH_SHORT).show()
        // val intent = Intent(this, VeinAuthActivity::class.java)
        // startActivity(intent)
        // finish()
    }

    private fun startDualAuth() {
        Toast.makeText(this, "Starting Dual Auth (Face+Vein)...", Toast.LENGTH_SHORT).show()
        // val intent = Intent(this, DualAuthActivity::class.java)
        // startActivity(intent)
        // finish()
    }
}
`;
// services/mockBackend.ts