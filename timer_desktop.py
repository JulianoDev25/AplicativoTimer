import tkinter as tk
from tkinter import ttk, messagebox
import time
import winsound

class DesktopTimer:
    def __init__(self, root):
        self.root = root
        self.root.title("Temporizador")
        self.root.geometry("360x420")
        self.root.resizable(False, False)
        self.root.configure(bg="#0f172a")

        # Configurações de estado
        self.total_seconds = 300
        self.remaining_seconds = 300
        self.is_running = False
        self.is_paused = False
        self.after_id = None
        self.end_time = None

        self.setup_ui()

    def setup_ui(self):
        # Título
        title_label = tk.Label(
            self.root,
            text="⏱️ Temporizador",
            font=("Segoe UI", 16, "bold"),
            bg="#0f172a",
            fg="#f8fafc"
        )
        title_label.pack(pady=(20, 10))

        # Display principal
        self.time_label = tk.Label(
            self.root,
            text="05:00",
            font=("Consolas", 42, "bold"),
            bg="#0f172a",
            fg="#6366f1"
        )
        self.time_label.pack(pady=10)

        # Status
        self.status_label = tk.Label(
            self.root,
            text="PRONTO",
            font=("Segoe UI", 10, "bold"),
            bg="#0f172a",
            fg="#94a3b8"
        )
        self.status_label.pack()

        # Botões Rápidos
        preset_frame = tk.Frame(self.root, bg="#0f172a")
        preset_frame.pack(pady=15)

        presets = [("1 min", 60), ("5 min", 300), ("15 min", 900), ("25 min", 1500)]
        for text, sec in presets:
            btn = tk.Button(
                preset_frame,
                text=text,
                font=("Segoe UI", 9),
                bg="#1e293b",
                fg="#f1f5f9",
                activebackground="#334155",
                activeforeground="#ffffff",
                relief="flat",
                padx=8,
                pady=4,
                command=lambda s=sec: self.set_preset(s)
            )
            btn.pack(side="left", padx=3)

        # Controles de Entrada Manual
        input_frame = tk.Frame(self.root, bg="#0f172a")
        input_frame.pack(pady=10)

        self.entry_min = tk.Spinbox(input_frame, from_=0, to=999, width=4, font=("Consolas", 12), justify="center")
        self.entry_min.delete(0, "end")
        self.entry_min.insert(0, "5")
        self.entry_min.pack(side="left", padx=2)

        tk.Label(input_frame, text="min", bg="#0f172a", fg="#94a3b8", font=("Segoe UI", 9)).pack(side="left", padx=(0, 8))

        self.entry_sec = tk.Spinbox(input_frame, from_=0, to=59, width=4, font=("Consolas", 12), justify="center")
        self.entry_sec.delete(0, "end")
        self.entry_sec.insert(0, "0")
        self.entry_sec.pack(side="left", padx=2)

        tk.Label(input_frame, text="seg", bg="#0f172a", fg="#94a3b8", font=("Segoe UI", 9)).pack(side="left", padx=(0, 8))

        btn_apply = tk.Button(
            input_frame,
            text="Aplicar",
            font=("Segoe UI", 9, "bold"),
            bg="#334155",
            fg="#f8fafc",
            relief="flat",
            command=self.apply_custom_time
        )
        btn_apply.pack(side="left", padx=4)

        # Botões Principais de Ação
        ctrl_frame = tk.Frame(self.root, bg="#0f172a")
        ctrl_frame.pack(pady=(20, 10))

        self.btn_start = tk.Button(
            ctrl_frame,
            text="Iniciar",
            font=("Segoe UI", 12, "bold"),
            bg="#6366f1",
            fg="#ffffff",
            activebackground="#4f46e5",
            activeforeground="#ffffff",
            relief="flat",
            width=10,
            pady=6,
            command=self.toggle_start_pause
        )
        self.btn_start.pack(side="left", padx=6)

        self.btn_reset = tk.Button(
            ctrl_frame,
            text="Zerar",
            font=("Segoe UI", 12, "bold"),
            bg="#1e293b",
            fg="#f8fafc",
            activebackground="#334155",
            activeforeground="#ffffff",
            relief="flat",
            width=8,
            pady=6,
            command=self.reset_timer
        )
        self.btn_reset.pack(side="left", padx=6)

    def format_time(self, seconds):
        m, s = divmod(seconds, 60)
        h, m = divmod(m, 60)
        if h > 0:
            return f"{h:02d}:{m:02d}:{s:02d}"
        return f"{m:02d}:{s:02d}"

    def update_display(self):
        self.time_label.config(text=self.format_time(self.remaining_seconds))

    def set_preset(self, seconds):
        if not self.is_running:
            self.total_seconds = seconds
            self.remaining_seconds = seconds
            self.update_display()

    def apply_custom_time(self):
        if not self.is_running:
            try:
                m = int(self.entry_min.get() or 0)
                s = int(self.entry_sec.get() or 0)
                total = m * 60 + s
                if total > 0:
                    self.total_seconds = total
                    self.remaining_seconds = total
                    self.update_display()
            except ValueError:
                pass

    def toggle_start_pause(self):
        if not self.is_running:
            self.start_timer()
        elif self.is_paused:
            self.resume_timer()
        else:
            self.pause_timer()

    def start_timer(self):
        if self.remaining_seconds <= 0:
            self.remaining_seconds = self.total_seconds

        self.is_running = True
        self.is_paused = False
        self.end_time = time.time() + self.remaining_seconds

        self.btn_start.config(text="Pausar", bg="#f59e0b", activebackground="#d97706")
        self.status_label.config(text="EM ANDAMENTO", fg="#10b981")
        self.time_label.config(fg="#10b981")
        self.tick()

    def pause_timer(self):
        if not self.is_running or self.is_paused:
            return
        self.is_paused = True
        if self.after_id:
            self.root.after_cancel(self.after_id)

        self.remaining_seconds = max(0, int(round(self.end_time - time.time())))
        self.btn_start.config(text="Retomar", bg="#6366f1", activebackground="#4f46e5")
        self.status_label.config(text="PAUSADO", fg="#f59e0b")
        self.time_label.config(fg="#f59e0b")

    def resume_timer(self):
        if not self.is_running or not self.is_paused:
            return
        self.is_paused = False
        self.end_time = time.time() + self.remaining_seconds

        self.btn_start.config(text="Pausar", bg="#f59e0b", activebackground="#d97706")
        self.status_label.config(text="EM ANDAMENTO", fg="#10b981")
        self.time_label.config(fg="#10b981")
        self.tick()

    def reset_timer(self):
        if self.after_id:
            self.root.after_cancel(self.after_id)
        self.is_running = False
        self.is_paused = False
        self.remaining_seconds = self.total_seconds

        self.btn_start.config(text="Iniciar", bg="#6366f1", activebackground="#4f46e5")
        self.status_label.config(text="PRONTO", fg="#94a3b8")
        self.time_label.config(fg="#6366f1")
        self.update_display()

    def tick(self):
        remaining = int(round(self.end_time - time.time()))

        if remaining <= 0:
            self.remaining_seconds = 0
            self.update_display()
            self.timer_finished()
            return

        self.remaining_seconds = remaining
        self.update_display()
        self.after_id = self.root.after(250, self.tick)

    def timer_finished(self):
        self.is_running = False
        self.is_paused = False
        self.btn_start.config(text="Iniciar", bg="#6366f1", activebackground="#4f46e5")
        self.status_label.config(text="FINALIZADO!", fg="#ef4444")
        self.time_label.config(fg="#ef4444")

        # Toca som de aviso no Windows
        try:
            for freq in (800, 1000, 1200):
                winsound.Beep(freq, 200)
        except Exception:
            pass

        messagebox.showinfo("Temporizador", "⏰ O tempo acabou!")

if __name__ == "__main__":
    app_root = tk.Tk()
    app = DesktopTimer(app_root)
    app_root.mainloop()
