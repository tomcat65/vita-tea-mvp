// UI Components inspired by shadcn/ui design patterns
// These are vanilla JS implementations that match shadcn/ui's aesthetic

export class Button {
  static create(options = {}) {
    const {
      variant = 'default',
      size = 'default',
      disabled = false,
      className = '',
      children = '',
      onClick = () => {}
    } = options;

    const button = document.createElement('button');
    
    // Base classes
    const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    
    // Variant classes
    const variantClasses = {
      default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
      outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
      secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline'
    };
    
    // Size classes
    const sizeClasses = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3 text-xs',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10'
    };
    
    button.className = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
    button.disabled = disabled;
    button.innerHTML = children;
    button.addEventListener('click', onClick);
    
    return button;
  }
}

export class Input {
  static create(options = {}) {
    const {
      type = 'text',
      placeholder = '',
      value = '',
      className = '',
      disabled = false,
      required = false,
      id = '',
      name = ''
    } = options;

    const input = document.createElement('input');
    
    // Base classes matching shadcn/ui input style
    const baseClasses = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
    
    input.type = type;
    input.className = `${baseClasses} ${className}`;
    input.placeholder = placeholder;
    input.value = value;
    input.disabled = disabled;
    input.required = required;
    if (id) {input.id = id;}
    if (name) {input.name = name;}
    
    return input;
  }
}

export class Card {
  static create(options = {}) {
    const { className = '', children = '' } = options;
    
    const card = document.createElement('div');
    card.className = `rounded-lg border bg-card text-card-foreground shadow-sm ${className}`;
    card.innerHTML = children;
    
    return card;
  }
  
  static createHeader(options = {}) {
    const { className = '', children = '' } = options;
    
    const header = document.createElement('div');
    header.className = `flex flex-col space-y-1.5 p-6 ${className}`;
    header.innerHTML = children;
    
    return header;
  }
  
  static createContent(options = {}) {
    const { className = '', children = '' } = options;
    
    const content = document.createElement('div');
    content.className = `p-6 pt-0 ${className}`;
    content.innerHTML = children;
    
    return content;
  }
}

export class Label {
  static create(options = {}) {
    const {
      htmlFor = '',
      className = '',
      children = '',
      required = false
    } = options;

    const label = document.createElement('label');
    label.className = `text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`;
    if (htmlFor) {label.htmlFor = htmlFor;}
    label.innerHTML = children + (required ? ' <span class="text-destructive">*</span>' : '');
    
    return label;
  }
}

export class Alert {
  static create(options = {}) {
    const {
      variant = 'default',
      className = '',
      children = ''
    } = options;

    const alert = document.createElement('div');
    
    const baseClasses = 'relative w-full rounded-lg border p-4';
    const variantClasses = {
      default: 'bg-background text-foreground',
      destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive'
    };
    
    alert.className = `${baseClasses} ${variantClasses[variant]} ${className}`;
    alert.innerHTML = children;
    
    return alert;
  }
}

// Helper function to create form fields with labels
export function createFormField(options = {}) {
  const {
    label = '',
    type = 'text',
    id = '',
    name = '',
    placeholder = '',
    required = false,
    className = ''
  } = options;

  const container = document.createElement('div');
  container.className = 'space-y-2';

  if (label) {
    const labelEl = Label.create({
      htmlFor: id,
      children: label,
      required
    });
    container.appendChild(labelEl);
  }

  const input = Input.create({
    type,
    id,
    name: name || id,
    placeholder,
    required,
    className
  });
  
  container.appendChild(input);
  
  return container;
}

// CSS variables for theming (add to your main CSS)
export const themeCSS = `
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 142.1 76.2% 36.3%;
    --primary-foreground: 355.7 100% 97.3%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 142.1 76.2% 36.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 142.1 70.6% 45.3%;
    --primary-foreground: 144.9 80.4% 10%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 142.1 76.2% 36.3%;
  }

  * {
    border-color: hsl(var(--border));
  }
  
  body {
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
  }
`;