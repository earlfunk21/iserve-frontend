Create a React Native (Expo) form component that follows the same patterns as components/sign-in-form.tsx in this project.

Requirements:
- Use react-hook-form with zod and zodResolver.
- Define a zod formSchema for all fields and pass it to useForm via resolver. Provide defaultValues for each field.
- Use shadcn/ui components already used in the project: Card, CardHeader, CardTitle, CardDescription, CardContent, Label, Input, Button, Text, and the Alert with AlertCircleIcon for form-level errors.
- Match the styling approach from sign-in-form.tsx:
  - Card: "rounded-3xl bg-card dark:bg-card border-border/0 shadow-none sm:border-border sm:shadow-sm sm:shadow-black/5"
  - Input: "h-12 rounded-xl bg-muted/50 dark:bg-muted/30"
  - Submit Button: "rounded-full w-full h-14 shadow-lg shadow-primary/20"
- Each field:
  - Use Controller.
  - Include Label with htmlFor and Input with id.
  - Wire Input to onChangeText, onBlur, value. Include proper keyboardType, autoComplete, and autoCapitalize where applicable.
  - Support onSubmitEditing={handleSubmit(onSubmit)}, returnKeyType="next", submitBehavior="submit" on fields.
- Form-level errors:
  - If errors.root exists, render <Alert variant="destructive" icon={AlertCircleIcon}> with title "Something went wrong" and the error message in AlertDescription.
  - In onSubmit, catch failures and call setError("root", { message: error.message }).
- Disable the submit Button when isSubmitting.
- Keep the structure:
  - <Card>
    - <CardHeader> with <CardTitle> and <CardDescription>
    - <CardContent> with fields and submit Button
- Use expo-router’s useRouter only if navigation/params are needed. Otherwise, accept an optional onSuccess callback.

Component API:
- Name: {ComponentName}
- Props: { onSuccess?: (values: Values) => void }
- Title text: {TitleText}
- Description text: {DescriptionText}
- Submit button text: {SubmitButtonText}

Fields to implement (with labels, placeholders, and types):
- {fieldName}:{type} — Label: {LabelText}, Placeholder: {Placeholder}, keyboardType: {keyboardType|omit}
- {add more fields...}

Behavior:
- Implement onSubmit as async.
- Add a TODO where the real API call goes. On success, call onSuccess?.(values).
- Show validation errors via zod; show form-level error via errors.root.

Imports you can use (align with sign-in-form.tsx):
- Button, Card*, Input, Label, Text, Alert, AlertDescription, AlertTitle
- zod, zodResolver, Controller, useForm
- AlertCircleIcon from lucide-react-native
- Optional: useRouter from expo-router

Output:
- A complete .tsx component that can live under components/{kebab-cased-component-name}.tsx.
- Ensure it compiles without web-only APIs.