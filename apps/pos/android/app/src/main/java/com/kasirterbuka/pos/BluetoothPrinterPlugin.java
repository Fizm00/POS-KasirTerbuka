package com.kasirterbuka.pos;

import android.Manifest;
import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.os.Build;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONException;

import java.io.IOException;
import java.io.OutputStream;
import java.util.Set;
import java.util.UUID;

@CapacitorPlugin(
    name = "BluetoothPrinter",
    permissions = {
        @Permission(
            strings = { Manifest.permission.BLUETOOTH_CONNECT, Manifest.permission.BLUETOOTH_SCAN },
            alias = "bluetooth"
        )
    }
)
public class BluetoothPrinterPlugin extends Plugin {

    // Standard SPP (Serial Port Profile) UUID for Bluetooth Classic thermal receipt printers
    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");

    @PluginMethod
    public void listBondedDevices(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (getPermissionState("bluetooth") != com.getcapacitor.PermissionState.GRANTED) {
                requestPermissionForAlias("bluetooth", call, "listBondedDevicesCallback");
                return;
            }
        }
        retrieveBondedDevices(call);
    }

    @PermissionCallback
    private void listBondedDevicesCallback(PluginCall call) {
        if (getPermissionState("bluetooth") == com.getcapacitor.PermissionState.GRANTED) {
            retrieveBondedDevices(call);
        } else {
            call.reject("Izin Bluetooth (BLUETOOTH_CONNECT) ditolak oleh pengguna.");
        }
    }

    @SuppressLint("MissingPermission")
    private void retrieveBondedDevices(PluginCall call) {
        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
        if (adapter == null) {
            call.reject("Perangkat ini tidak memiliki adaptor Bluetooth.");
            return;
        }

        if (!adapter.isEnabled()) {
            call.reject("Bluetooth tidak aktif. Silakan aktifkan Bluetooth di perangkat Anda.");
            return;
        }

        Set<BluetoothDevice> pairedDevices = adapter.getBondedDevices();
        JSArray deviceList = new JSArray();

        if (pairedDevices != null) {
            for (BluetoothDevice device : pairedDevices) {
                JSObject devObj = new JSObject();
                devObj.put("name", device.getName() != null ? device.getName() : "Printer Bluetooth");
                devObj.put("address", device.getAddress());
                deviceList.put(devObj);
            }
        }

        JSObject ret = new JSObject();
        ret.put("devices", deviceList);
        call.resolve(ret);
    }

    @PluginMethod
    public void printRaw(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (getPermissionState("bluetooth") != com.getcapacitor.PermissionState.GRANTED) {
                requestPermissionForAlias("bluetooth", call, "printRawCallback");
                return;
            }
        }
        executePrint(call);
    }

    @PermissionCallback
    private void printRawCallback(PluginCall call) {
        if (getPermissionState("bluetooth") == com.getcapacitor.PermissionState.GRANTED) {
            executePrint(call);
        } else {
            call.reject("Izin Bluetooth (BLUETOOTH_CONNECT) ditolak oleh pengguna.");
        }
    }

    @SuppressLint("MissingPermission")
    private void executePrint(PluginCall call) {
        String address = call.getString("address");
        if (address == null || address.trim().isEmpty()) {
            call.reject("Alamat MAC printer Bluetooth tidak boleh kosong.");
            return;
        }

        JSArray dataArray = call.getArray("data");
        if (dataArray == null || dataArray.length() == 0) {
            call.reject("Data cetak tidak boleh kosong.");
            return;
        }

        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
        if (adapter == null || !adapter.isEnabled()) {
            call.reject("Bluetooth belum aktif di perangkat Anda.");
            return;
        }

        // Run network/socket operations on background thread
        bridge.execute(() -> {
            BluetoothSocket socket = null;
            OutputStream outputStream = null;
            try {
                BluetoothDevice device = adapter.getRemoteDevice(address);
                if (device == null) {
                    call.reject("Perangkat printer dengan alamat " + address + " tidak ditemukan.");
                    return;
                }

                adapter.cancelDiscovery();

                socket = device.createRfcommSocketToServiceRecord(SPP_UUID);
                socket.connect();
                outputStream = socket.getOutputStream();

                byte[] bytes = new byte[dataArray.length()];
                for (int i = 0; i < dataArray.length(); i++) {
                    bytes[i] = (byte) dataArray.getInt(i);
                }

                outputStream.write(bytes);
                outputStream.flush();

                try {
                    Thread.sleep(100);
                } catch (InterruptedException ignored) {}

                call.resolve();
            } catch (IOException e) {
                call.reject("Gagal terhubung atau mengirim data ke printer Bluetooth: " + e.getMessage());
            } catch (JSONException e) {
                call.reject("Format data struk tidak valid: " + e.getMessage());
            } finally {
                if (outputStream != null) {
                    try {
                        outputStream.close();
                    } catch (IOException ignored) {}
                }
                if (socket != null) {
                    try {
                        socket.close();
                    } catch (IOException ignored) {}
                }
            }
        });
    }
}
