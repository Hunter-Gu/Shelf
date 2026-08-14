type PinProps = {
	icon: string;
};

export function Pin({ icon }: PinProps) {
	return (
		<div className="flex-1 flex items-center justify-center py-2 rounded-xl shadow-sm bg-slate-100 hover:bg-gray-200 cursor-pointer">
			<img src={icon} alt="Quick access" className="w-6 h-6" />
		</div>
	);
}
