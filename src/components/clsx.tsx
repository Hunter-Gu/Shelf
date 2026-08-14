import { cn } from 'common/lib/utils';
import { forwardRef, type ComponentType } from 'react';

const NODES = [
	'a',
	'button',
	'div',
	'form',
	'h2',
	'h3',
	'img',
	'input',
	'label',
	'li',
	'nav',
	'ol',
	'p',
	'span',
	'svg',
	'ul',
] as const;

type Clsx = {
	[E in (typeof NODES)[number]]: (className: string) => PrimitiveForwardRefComponent<E>;
};
type PrimitivePropsWithRef<E extends React.ElementType> = React.ComponentPropsWithRef<E>;
interface PrimitiveForwardRefComponent<E extends React.ElementType>
	extends React.ForwardRefExoticComponent<PrimitivePropsWithRef<E>> {}

export const clsx = NODES.reduce((acc, node) => {
	const Node = forwardRef((props: PrimitivePropsWithRef<typeof node>, ref: any) => {
		const Comp = node;
		return <Comp ref={ref} {...props} />;
	});

	Node.displayName = `clsx.${node}`;

	return {
		...acc,
		[node]: withClsx.bind(null, Node),
	};
}, {} as Clsx);

export function withClsx<Props extends { className?: string }>(
	Comp: ComponentType<Props>,
	presetClassName = '',
) {
	const Component = forwardRef(({ className, ...props }: Props, ref: any) => {
		return <Comp className={cn(presetClassName, className)} ref={ref} {...props} />;
	});

	Component.displayName = `withClsx(${Comp.displayName || Comp.name})`;

	return Component;
}
